"""Debt selection and report columns, independent of live finance services."""
import json
import re
import pytest

from src.report import latest_debt, render_report


def test_latest_debt_uses_latest_valid_date_across_all_available_periods():
    row = {"fundamentals": {"currency": "EUR", "annual": [
        {"date": "2024-12-31", "values": {"total_debt": 9e9}}], "quarterly": [
        {"date": "2025-03-31", "values": {"total_debt": 5e9}},
        {"date": "2025-09-30", "values": {}},
        {"date": "2025-06-30", "values": {"total_debt": 4e9}}]},
        "finance": {"statements": {"currency": "EUR", "annual": [], "quarterly": [
            {"date": "2025-09-30", "values": {"total_debt": 3e9}}]}}}
    assert latest_debt(row) == {"date": "2025-09-30", "value": 3e9, "currency": "EUR"}


@pytest.mark.parametrize("invalid", [None, float("nan"), float("inf"), -1, True, "123"])
def test_latest_debt_skips_missing_or_invalid_debt(invalid):
    row = {"fundamentals": {"annual": [
        {"date": "2025-12-31", "values": {"total_debt": invalid}},
        {"date": "2024-12-31", "values": {"total_debt": 0}}]}}
    assert latest_debt(row) == {"date": "2024-12-31", "value": 0, "currency": ""}


def test_latest_debt_skips_future_and_invalid_dates():
    assert latest_debt({"fundamentals": {"annual": [
        {"date": "9999-12-31", "values": {"total_debt": 1}},
        {"date": "invalid", "values": {"total_debt": 1}}]}}) is None
    assert latest_debt({}) is None


def test_report_columns_debt_units_and_missing_values(tmp_path):
    row = dict(ticker="TEST", name="Test", market="US", score=70,
               last_close=100, support=98, distance_pct=2, high_52w=120,
               drawdown_pct=16.67, days_since_high=10, rating="Buy", num_analysts=3,
               community=20, demand=50, short_pct=None)
    rows = [{**row, "fundamentals": {"currency": "USD", "quarterly": [
        {"date": "2025-09-30", "values": {"total_debt": 2e9}}]}},
        {**row, "ticker": "MISSING"}]
    markup = render_report(rows, tmp_path / "report.html").read_text(encoding="utf-8")
    headers = re.findall(r'<th[^>]*>(.*?)</th>', markup)
    assert headers == ["Score", "Ticker", "Name", "Market", "Drawdown", "Rating",
                       "# Analysts", "Demand", "Short %", "Debt now"]
    assert 'data-sort-value="2000000000.0"' in markup
    assert 'Total debt as of 2025-09-30 (USD)' in markup
    assert '>2.00B USD</td>' in markup
    assert 'data-sort-value="">n/a</td>' in markup
    payload = json.loads(re.search(r'id="details-data">(.*?)</script>', markup, re.S)[1])
    assert payload["TEST"]["debt_now"]["value"] == 2e9
    assert payload["MISSING"]["debt_now"] is None
