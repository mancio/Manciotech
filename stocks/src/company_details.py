"""Collect optional company details without changing which stocks are screened."""
from __future__ import annotations

import json
import math
import time

import pandas as pd
import yfinance as yf

from . import config
from .company_market import fetch_company_market
from .company_statements import fetch_company_statements
from .fundamentals import fetch_fundamentals


_SNAPSHOT_TTL_SECONDS = 12 * 60 * 60
_STATEMENT_TTL_SECONDS = 3 * 24 * 60 * 60


def fetch_company_details(ticker: str) -> dict:
    path = config.COMPANY_DETAILS_CACHE_DIR / f"{ticker.replace('/', '_')}.json"
    now = time.time()
    cached = {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(payload, dict) and isinstance(payload.get("details"), dict):
            cached = payload
            if now - path.stat().st_mtime < _SNAPSHOT_TTL_SECONDS:
                return cached["details"]
    except (OSError, ValueError):
        pass

    handle = yf.Ticker(ticker)
    try:
        info = handle.info or {}
    except Exception as exc:  # Optional Yahoo quote data can fail on its own.
        print(f"[company details] {ticker}: Yahoo quote error ({type(exc).__name__})")
        info = {}

    financial_currency = info.get("financialCurrency")
    balance_sheet = fetch_fundamentals(
        ticker, handle=handle, currency=financial_currency if isinstance(financial_currency, str) else ""
    )
    # Financial statements are dated reports. Reuse them across daily quote refreshes.
    statements = cached.get("details", {}).get("finance", {}).get("statements")
    statements_at = cached.get("statements_at", 0)
    if not statements or now - statements_at >= _STATEMENT_TTL_SECONDS:
        updated = fetch_company_statements(ticker, balance_sheet, handle=handle, info=info)
        if updated:
            statements = updated
            statements_at = now
    market = fetch_company_market(ticker, statements, handle=handle, info=info)

    details = {}
    if balance_sheet:
        details["fundamentals"] = balance_sheet
    if statements or market:
        details["finance"] = {}
        if statements:
            details["finance"]["statements"] = statements
        if market:
            details["finance"]["market"] = market
        try:
            encoded = json.dumps({"details": details, "statements_at": statements_at}, allow_nan=False)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(encoded, encoding="utf-8")
        except (OSError, ValueError) as exc:
            print(f"[company details] {ticker}: cache error ({type(exc).__name__})")
    return details


def target_price_history(history: pd.DataFrame, target: dict) -> list[dict]:
    """Use sampled weekly closes from the report's existing daily price history."""
    current = target.get("current")
    if not target.get("history_compatible") or not current or history.empty:
        return []
    closes = history["Close"].astype(float).sort_index()
    closes = closes[closes.map(lambda value: math.isfinite(value) and value > 0)]
    if closes.empty or not 0.8 <= closes.iloc[-1] / current <= 1.25:
        # The quote and series must be on a comparable scale (e.g. no pence/pound mix).
        return []
    weekly = closes.groupby(closes.index.tz_localize(None).to_period("W-FRI")).tail(1)
    return [{"date": date.date().isoformat(), "close": float(close)} for date, close in weekly.items()]
