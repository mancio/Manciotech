"""Financial chart series from Yahoo Finance's reported company statements.

Use the unformatted row names from yfinance's financial time series. Join
statements by their fiscal period end, preserving gaps in each series.
"""
from __future__ import annotations

from collections.abc import Callable, Mapping
from datetime import date

from yfinance.exceptions import YFRateLimitError

from .fundamentals import _clean

_INCOME_FIELDS = {
    "TotalRevenue": "revenue",
    "NetIncome": "net_income",
    "GrossProfit": "gross_profit",
    "OperatingIncome": "operating_income",
    "PretaxIncome": "pretax_income",
    "DilutedEPS": "diluted_eps",
}
_CASH_FLOW_FIELDS = {"FreeCashFlow": "free_cash_flow"}
_BALANCE_FIELDS = {
    "cash_and_equivalents": "cash",
    "total_debt": "total_debt",
    "current_assets": "current_assets",
    "non_current_assets": "non_current_assets",
    "current_liabilities": "current_liabilities",
    "non_current_liabilities": "non_current_liabilities",
}


def _statement(
    getter: Callable,
    frequency: str,
    fields: Mapping[str, str],
    ticker: str,
) -> dict[str, dict[str, float]]:
    """Read usable cells from one statement, independently of other requests."""
    try:
        frame = getter(freq=frequency, pretty=False)
    except YFRateLimitError:
        raise
    except Exception as exc:  # noqa: BLE001 - a missing statement is optional
        print(f"[company statements] {ticker}: {frequency} {type(exc).__name__}")
        return {}

    if frame is None or frame.empty:
        return {}
    periods = {}
    available = {row: key for row, key in fields.items() if row in frame.index}
    for column in frame.columns:
        period = getattr(column, "date", lambda: None)()
        if not isinstance(period, date):
            continue
        values = {}
        for row, key in available.items():
            value = _clean(frame.at[row, column])
            if value is not None:
                values[key] = value
        if values:
            periods[period.isoformat()] = values
    return periods


def _derive_income_values(values: dict[str, float]) -> None:
    revenue = values.get("revenue")
    net_income = values.get("net_income")
    if revenue and net_income is not None:
        margin = _clean(net_income / revenue * 100)
        if margin is not None:
            values["net_margin_pct"] = margin

    gross = values.get("gross_profit")
    operating = values.get("operating_income")
    pretax = values.pop("pretax_income", None)
    if None in (revenue, gross, operating, pretax, net_income):
        return

    # Reconcile reported subtotals. The operating and tax steps include all
    # adjustments between their adjacent totals so the waterfall balances.
    values.update(
        cost_of_revenue=revenue - gross,
        operating_expenses=gross - operating,
        non_operating_income=pretax - operating,
        taxes_and_other=pretax - net_income,
    )


def merge_balance_sheet(statements: dict | None, fundamentals: dict | None) -> dict | None:
    """Add reported balance values by fiscal date, including to cached cash flows."""
    if not fundamentals:
        return statements
    statements = statements or {}
    currency = statements.get("currency")
    balance_currency = fundamentals.get("currency")
    if currency and balance_currency and currency != balance_currency:
        return statements
    merged = {"currency": currency or balance_currency or ""}
    for period in ("annual", "quarterly"):
        series = {row["date"]: dict(row["values"]) for row in statements.get(period, [])}
        for row in fundamentals.get(period, []):
            reported = row["values"]
            values = {key: reported[source] for source, key in _BALANCE_FIELDS.items() if source in reported}
            if values:
                series.setdefault(row["date"], {}).update(values)
        merged[period] = [{"date": date, "values": series[date]} for date in sorted(series, reverse=True)]
    return merged if merged["annual"] or merged["quarterly"] else None


def fetch_company_statements(
    ticker: str,
    fundamentals: dict | None,
    *,
    handle,
    info: dict | None,
) -> dict | None:
    """Return available annual and quarterly chart values, newest periods first."""
    result = {}
    for period, frequency in (("annual", "yearly"), ("quarterly", "quarterly")):
        series = _statement(handle.get_income_stmt, frequency, _INCOME_FIELDS, ticker)
        for values in series.values():
            _derive_income_values(values)
        cash_flows = _statement(handle.get_cashflow, frequency, _CASH_FLOW_FIELDS, ticker)
        for period_end, values in cash_flows.items():
            series.setdefault(period_end, {}).update(values)

        result[period] = [
            {"date": period_end, "values": series[period_end]}
            for period_end in sorted(series, reverse=True)
            if series[period_end]
        ]

    currency = (info or {}).get("financialCurrency")
    result["currency"] = currency if isinstance(currency, str) else ""
    statements = result if result["annual"] or result["quarterly"] else None
    return merge_balance_sheet(statements, fundamentals)
