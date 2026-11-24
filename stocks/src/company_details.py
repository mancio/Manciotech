"""Collect optional company details without changing which stocks are screened."""
from __future__ import annotations

import json
import math
import time
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock

import pandas as pd
import yfinance as yf
from yfinance.exceptions import YFRateLimitError

from . import config
from .company_market import fetch_company_market
from .company_statements import fetch_company_statements
from .fundamentals import fetch_fundamentals


_SNAPSHOT_TTL_SECONDS = 12 * 60 * 60
_STATEMENT_TTL_SECONDS = 3 * 24 * 60 * 60
_STALE_TTL_SECONDS = 7 * 24 * 60 * 60
_YAHOO_INTERVAL_SECONDS = 1.5
_YAHOO_BACKOFF_SECONDS = (15 * 60, 30 * 60, 60 * 60)
_rate_lock = Lock()
_next_company_start = 0.0
_retry_after = 0.0
_rate_limits = 0


def _wait_for_yahoo() -> bool:
    """Pace ticker fetches across all workers, including after Yahoo signals a limit."""
    global _next_company_start
    while True:
        with _rate_lock:
            if _rate_limits > len(_YAHOO_BACKOFF_SECONDS):
                return False
            now = time.monotonic()
            delay = max(_next_company_start, _retry_after) - now
            if delay <= 0:
                _next_company_start = now + _YAHOO_INTERVAL_SECONDS
                return True
        time.sleep(delay)


def _back_off_yahoo() -> None:
    global _retry_after, _rate_limits
    with _rate_lock:
        now = time.monotonic()
        if now < _retry_after or _rate_limits > len(_YAHOO_BACKOFF_SECONDS):
            return
        _rate_limits += 1
        if _rate_limits <= len(_YAHOO_BACKOFF_SECONDS):
            delay = _YAHOO_BACKOFF_SECONDS[_rate_limits - 1]
            _retry_after = now + delay
            print(f"[company details] Yahoo rate limit: pausing new fetches for {delay} seconds")
        else:
            print("[company details] Yahoo rate limit persisted; using available cached details")


def _stale_details(cached: dict, saved_at: float, now: float) -> dict:
    details = cached.get("details") or {}
    if not details or now - saved_at >= _STALE_TTL_SECONDS:
        return {}
    finance = details.get("finance") or {}
    captured = datetime.fromtimestamp(saved_at, timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    return {**details, "finance": {**finance, "cached_as_of": captured}}


def fetch_company_details(ticker: str) -> dict:
    path = config.COMPANY_DETAILS_CACHE_DIR / f"{ticker.replace('/', '_')}.json"
    now = time.time()
    cached = {}
    saved_at = 0.0
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(payload, dict) and isinstance(payload.get("details"), dict):
            cached = payload
            saved_at = path.stat().st_mtime
            if now - saved_at < _SNAPSHOT_TTL_SECONDS:
                return cached["details"]
    except (OSError, ValueError):
        pass

    for _ in range(len(_YAHOO_BACKOFF_SECONDS) + 1):
        if not _wait_for_yahoo():
            break
        try:
            return _fetch_uncached_details(ticker, path, cached)
        except YFRateLimitError:
            _back_off_yahoo()
    return _stale_details(cached, saved_at, time.time())


def _fetch_uncached_details(ticker: str, path: Path, cached: dict) -> dict:
    handle = yf.Ticker(ticker)
    try:
        info = handle.info or {}
    except YFRateLimitError:
        raise
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
    if not statements or time.time() - statements_at >= _STATEMENT_TTL_SECONDS:
        updated = fetch_company_statements(ticker, balance_sheet, handle=handle, info=info)
        if updated:
            statements = updated
            statements_at = time.time()
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
