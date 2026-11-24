"""Yahoo Finance quotes, valuation history, earnings and analyst actions."""
from __future__ import annotations

import math
from collections.abc import Mapping
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import pandas as pd


_CAPITAL_FIELDS = {
    "market_cap": "marketCap",
    "enterprise_value": "enterpriseValue",
}
_BALANCE_FIELDS = {"debt": "total_debt", "cash": "cash"}
_TARGET_FIELDS = {
    "mean": "targetMeanPrice",
    "low": "targetLowPrice",
    "high": "targetHighPrice",
    "current": "currentPrice",
}
_VALUATION_FIELDS = {"pe": "Trailing P/E", "ps": "Price/Sales"}
_ACTION_LABELS = {
    "main": "Maintained",
    "up": "Upgraded",
    "down": "Downgraded",
    "init": "Initiated",
    "reit": "Reiterated",
    "res": "Resumed",
}
_CURRENCY_SUBUNITS = {"GBp": "GBP", "GBX": "GBP", "ZAc": "ZAR", "ILA": "ILS"}
_PERIODS = {
    "annual": ("0y", "Current FY", "+1y", "Next FY"),
    "quarterly": ("0q", "Current quarter", "+1q", "Next quarter"),
}


def _number(value) -> float | None:
    if isinstance(value, bool):
        return None
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if math.isfinite(result) else None


def _numbers(source: Mapping, fields: Mapping[str, str]) -> dict[str, float]:
    result = {}
    for target, key in fields.items():
        value = _number(source.get(key))
        if value is not None:
            result[target] = value
    return result


def _text(value) -> str:
    return value.strip() if isinstance(value, str) else ""


def _date(value) -> str | None:
    try:
        timestamp = pd.Timestamp(value)
    except (TypeError, ValueError):
        return None
    return None if pd.isna(timestamp) else timestamp.date().isoformat()


def _frame(ticker: str, handle, field: str, **kwargs) -> pd.DataFrame:
    try:
        endpoint = getattr(handle, field, None)
        result = endpoint(**kwargs) if callable(endpoint) else endpoint
        if isinstance(result, pd.DataFrame):
            return result
    except Exception as exc:  # Optional Yahoo response for this company only.
        print(f"[company market] {ticker} {field}: Yahoo error ({type(exc).__name__})")
    return pd.DataFrame()


def _capital_structure(info: Mapping, statements: Mapping) -> dict | None:
    currency = _text(info.get("currency"))
    financial_currency = _text(info.get("financialCurrency"))
    # Yahoo quotes market cap in base currency even when prices use pence.
    # Do not combine quote and accounting figures when their currencies differ.
    if not financial_currency or _CURRENCY_SUBUNITS.get(currency, currency) != financial_currency:
        return None
    values = _numbers(info, _CAPITAL_FIELDS)
    if statements.get("currency") == financial_currency:
        periods = (statements.get("quarterly") or []) + (statements.get("annual") or [])
        for period in sorted(periods, key=lambda p: p["date"], reverse=True):
            balance = _numbers(period.get("values") or {}, _BALANCE_FIELDS)
            if balance:
                values.update(balance)
                values["balance_date"] = period["date"]
                break
    if len(values.keys() - {"balance_date"}) < 2:
        return None
    return {"currency": financial_currency, **values}


def _price_target(info: Mapping) -> dict | None:
    currency = _text(info.get("currency"))
    values = {key: value for key, value in _numbers(info, _TARGET_FIELDS).items() if value > 0}
    if not currency or not any(key in values for key in ("mean", "low", "high")):
        return None
    current = values.get("current")
    regular = _number(info.get("regularMarketPrice"))
    # The financialData target module does not include currency. Check that
    # its current price and the ticker's separately reported quote use the
    # same scale before attaching the quote unit to its targets.
    if current is None or regular is None or not math.isclose(current, regular, rel_tol=0.03):
        return None
    return {"currency": currency, "history_compatible": True, **values}


def _valuation(ticker: str, handle) -> dict:
    result = {}
    for period, frequency in (("annual", "yearly"), ("quarterly", "quarterly")):
        frame = _frame(ticker, handle, "get_valuation_measures", freq=frequency, periods=5)
        points = []
        for column in frame.columns:
            values = _numbers(frame[column], _VALUATION_FIELDS)
            if not values:
                continue
            if column == "Current":
                result.setdefault("current", values)
                continue
            date = _date(column)
            if date:
                points.append({"date": date, **values})
        if points:
            result[period] = sorted(points, key=lambda p: p["date"])
    return result


def _estimate(frame: pd.DataFrame, key: str) -> float | None:
    if "avg" not in frame or key not in frame.index:
        return None
    row = frame.loc[key]
    count = _number(row.get("numberOfAnalysts"))
    value = _number(row["avg"])
    # Yahoo may encode an unavailable estimate as an all-zero entry.
    if count == 0 or (count is None and value == 0):
        return None
    return value


def _column_label(frame: pd.DataFrame, column: str) -> str:
    if column in frame:
        return next((label for item in frame[column] if (label := _text(item))), "")
    return ""


def _upcoming_earnings(info: Mapping) -> str | None:
    start = _number(info.get("earningsTimestampStart"))
    end = _number(info.get("earningsTimestampEnd"))
    if start is None or end is None or start > end:
        return None
    try:
        zone_name = _text(info.get("exchangeTimezoneName"))
        zone = ZoneInfo(zone_name) if zone_name else timezone.utc
    except (ValueError, ZoneInfoNotFoundError):
        zone = timezone.utc
    try:
        start_date = datetime.fromtimestamp(start, zone).date()
        end_date = datetime.fromtimestamp(end, zone).date()
    except (ValueError, OSError, OverflowError):
        return None
    if start_date == end_date and start_date >= datetime.now(zone).date():
        return start_date.isoformat()
    return None


def _earnings(ticker: str, handle, statements: Mapping, info: Mapping) -> dict:
    history = _frame(ticker, handle, "earnings_history")
    revenue = _frame(ticker, handle, "revenue_estimate")
    eps = _frame(ticker, handle, "earnings_estimate")
    statement_currency = _text(statements.get("currency")) or _text(info.get("financialCurrency"))
    revenue_currency = _column_label(revenue, "currency")
    eps_currency = _column_label(eps, "currency")
    history_method = _column_label(history, "methodology")
    estimate_method = _column_label(eps, "methodology")
    eps_currency_differs = bool(eps_currency and statement_currency and eps_currency != statement_currency)
    eps_method_differs = bool(history_method and estimate_method and history_method != estimate_method)
    eps_history = {}
    for index, row in history.iterrows():
        date = _date(index)
        values = _numbers(row, {"eps_actual": "epsActual", "eps_estimate": "epsEstimate"})
        if date and values:
            eps_history[date] = values

    result = {}
    for period, keys in _PERIODS.items():
        # Yahoo statement EPS is diluted reported EPS. The annual analyst
        # forecast may be normalized, so do not overlay it with reported EPS.
        include_annual_eps = not eps_currency_differs and (
            not estimate_method or estimate_method == "gaap"
        )
        include_revenue_estimates = not (
            revenue_currency and statement_currency and revenue_currency != statement_currency
        )
        include_quarterly_eps_estimates = not eps_history or not (eps_method_differs or eps_currency_differs)
        points = {}
        for item in statements.get(period) or []:
            fields = {"revenue_actual": "revenue"}
            if period == "annual" and include_annual_eps:
                fields["eps_actual"] = "diluted_eps"
            values = _numbers(item.get("values") or {}, fields)
            if values and item.get("date"):
                points[item["date"]] = values
        if period == "quarterly":
            for date, values in eps_history.items():
                points.setdefault(date, {}).update(values)
        ordered = [
            {"date": date, "label": date[:4] if period == "annual" else date, **values}
            for date, values in sorted(points.items())
        ]
        for key, label in zip(keys[::2], keys[1::2]):
            point = {"label": label}
            if include_revenue_estimates and (value := _estimate(revenue, key)) is not None:
                point["revenue_estimate"] = value
            if (period == "annual" or include_quarterly_eps_estimates) and (value := _estimate(eps, key)) is not None:
                point["eps_estimate"] = value
            if len(point) > 1:
                ordered.append(point)
        if ordered:
            result[period] = ordered

    if result:
        for key, value in {
            "revenue_currency": statement_currency or revenue_currency,
            "eps_currency": None if eps_history and eps_currency_differs else eps_currency or statement_currency,
            "next_date": _upcoming_earnings(info),
        }.items():
            if value:
                result[key] = value
    return result


def _analyst_actions(ticker: str, handle) -> list[dict]:
    frame = _frame(ticker, handle, "upgrades_downgrades")
    actions = []
    for index, row in frame.sort_index(ascending=False).iterrows():
        date = _date(index)
        firm = _text(row.get("Firm"))
        action = _text(row.get("Action"))
        if not (date and firm):
            continue
        item = {"date": date, "firm": firm}
        for key, value in {
            "action": _ACTION_LABELS.get(action, action),
            "from_grade": _text(row.get("FromGrade")),
            "to_grade": _text(row.get("ToGrade")),
        }.items():
            if value:
                item[key] = value
        if len(item) > 2:
            actions.append(item)
        if len(actions) == 8:
            break
    return actions


def fetch_company_market(ticker: str, statements: dict | None, *, handle, info: Mapping) -> dict:
    """Fetch company charts with available Yahoo values and no synthetic data."""
    statements = statements or {}
    sections = {
        "capital_structure": _capital_structure(info, statements),
        "price_target": _price_target(info),
        "valuation": _valuation(ticker, handle),
        "earnings": _earnings(ticker, handle, statements, info),
        "analyst_actions": _analyst_actions(ticker, handle),
    }
    return {key: value for key, value in sections.items() if value}
