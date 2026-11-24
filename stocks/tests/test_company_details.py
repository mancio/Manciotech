"""Test company-detail integration without network calls."""
from __future__ import annotations

import json
import os
import re
import time
from types import SimpleNamespace

import pandas as pd
import pytest
from yfinance.exceptions import YFRateLimitError

from src import company_details
from src.report import render_report


def test_shared_quote_and_cache(monkeypatch, tmp_path):
    monkeypatch.setattr(company_details.config, "COMPANY_DETAILS_CACHE_DIR", tmp_path)
    monkeypatch.setattr(company_details, "_wait_for_yahoo", lambda: True)
    info = {"financialCurrency": "EUR", "currency": "GBp"}
    handle = SimpleNamespace(info=info)
    quotes = []

    def ticker(symbol):
        quotes.append(symbol)
        return handle

    def balance(symbol, *, handle, currency):
        assert handle.info is info
        assert currency == "EUR"
        return None

    statements = {"annual": [{"date": "2025-12-31", "values": {"revenue": 63}}]}
    statement_calls = []

    def load_statements(symbol, *args, **kwargs):
        statement_calls.append(symbol)
        return statements

    monkeypatch.setattr(company_details.yf, "Ticker", ticker)
    monkeypatch.setattr(company_details, "fetch_fundamentals", balance)
    monkeypatch.setattr(company_details, "fetch_company_statements", load_statements)
    monkeypatch.setattr(
        company_details, "fetch_company_market",
        lambda symbol, statements, *, handle, info: {"valuation_snapshot": {"trailing_pe": 21}},
    )

    first = company_details.fetch_company_details("VOD.L")
    assert first["finance"]["statements"] == statements
    assert first["finance"]["market"] == {"valuation_snapshot": {"trailing_pe": 21}}
    assert company_details.fetch_company_details("VOD.L") == first
    assert quotes == ["VOD.L"]

    yesterday = time.time() - 86400
    os.utime(tmp_path / "VOD.L.json", (yesterday, yesterday))
    assert company_details.fetch_company_details("VOD.L") == first
    assert quotes == ["VOD.L", "VOD.L"]
    assert statement_calls == ["VOD.L"]


def test_rate_limit_reuses_only_recent_cached_details(monkeypatch, tmp_path):
    monkeypatch.setattr(company_details.config, "COMPANY_DETAILS_CACHE_DIR", tmp_path)
    monkeypatch.setattr(company_details, "_wait_for_yahoo", lambda: False)
    path = tmp_path / "VOD.L.json"
    market = {"price_target": {"current": 100, "mean": 120}}
    path.write_text(json.dumps({"details": {"finance": {"market": market}}}), encoding="utf-8")

    yesterday = time.time() - 86400
    os.utime(path, (yesterday, yesterday))
    result = company_details.fetch_company_details("VOD.L")
    assert result["finance"]["market"] == market
    assert result["finance"]["cached_as_of"].endswith("UTC")

    last_week = time.time() - 8 * 86400
    os.utime(path, (last_week, last_week))
    assert company_details.fetch_company_details("VOD.L") == {}


@pytest.mark.parametrize("failures", [3, 4])
def test_endpoint_rate_limit_waits_for_each_retry(monkeypatch, tmp_path, failures):
    monkeypatch.setattr(company_details.config, "COMPANY_DETAILS_CACHE_DIR", tmp_path)
    for field in ("_rate_limits", "_retry_after", "_next_company_start"):
        monkeypatch.setattr(company_details, field, 0)

    waits = []
    started = []
    monkeypatch.setattr(company_details, "time", SimpleNamespace(
        monotonic=lambda: sum(waits),
        sleep=waits.append,
        time=lambda: time.time() + sum(waits),
    ))
    monkeypatch.setattr(company_details, "fetch_fundamentals", lambda *args, **kwargs: None)
    monkeypatch.setattr(company_details, "fetch_company_statements", lambda *args, **kwargs: None)

    class Ticker:
        info = {}

        def __init__(self, symbol):
            started.append(sum(waits))

        def get_valuation_measures(self, *, freq, periods):
            if len(started) <= failures:
                raise YFRateLimitError()
            return pd.DataFrame({"Current": [20]}, index=["Trailing P/E"])

    monkeypatch.setattr(company_details.yf, "Ticker", Ticker)
    result = company_details.fetch_company_details("TEST")
    assert waits == [900, 1800, 3600]
    assert started == [0, 900, 2700, 6300]
    if failures == 3:
        assert result["finance"]["market"]["valuation"]["current"] == {"pe": 20}
        assert company_details.fetch_company_details("TEST") == result
    else:
        assert result == {}
        assert company_details.fetch_company_details("ANOTHER") == {}
    assert len(started) == 4


def test_target_history_preserves_weekly_actual_closes_and_checks_quote_scale():
    dates = pd.DatetimeIndex(["2026-11-19", "2026-11-20", "2026-11-24"], tz="UTC")
    frame = pd.DataFrame({"Close": [98, 99, 101]}, index=dates)
    target = {"current": 102, "history_compatible": True}

    assert company_details.target_price_history(frame, target) == [
        {"date": "2026-11-20", "close": 99.0},
        {"date": "2026-11-24", "close": 101.0},
    ]
    assert not company_details.target_price_history(frame, {**target, "current": 1.02})
    assert not company_details.target_price_history(frame, {**target, "history_compatible": False})


def test_report_embeds_optional_finance_per_ticker(tmp_path):
    row = {
        "name": "Example", "market": "US", "rating": "Buy", "num_analysts": 1,
        "last_close": 100, "support": 99, "distance_pct": 1, "high_52w": 120,
        "drawdown_pct": 16, "days_since_high": 4,
        "score": 80, "community": 0, "demand": 50, "short_pct": None, "reasons": "",
    }
    finance = {"statements": {"currency": "USD", "annual": [], "quarterly": []}}
    path = render_report(
        [dict(row, ticker="FULL", finance=finance), dict(row, ticker="EMPTY")],
        tmp_path / "report.html",
    )
    html = path.read_text(encoding="utf-8")
    match = re.search(r'<script type="application/json" id="details-data">(.*?)</script>', html, re.S)
    details = json.loads(match[1])
    assert details["FULL"]["finance"] == finance
    assert details["EMPTY"]["finance"] is None
