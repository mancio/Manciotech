from types import SimpleNamespace

import pandas as pd

from src.company_market import fetch_company_market


def test_quote_units_and_mixed_currency_capital_structure():
    info = {
        "currency": "GBp",
        "financialCurrency": "EUR",
        "marketCap": 23e9,
        "totalDebt": 59e9,
        "totalCash": 11e9,
        "enterpriseValue": 76e9,
        "targetMeanPrice": 121,
        "targetHighPrice": 155,
        "currentPrice": 101.75,
        "regularMarketPrice": 101.75,
    }
    market = fetch_company_market("VOD.L", None, handle=SimpleNamespace(), info=info)
    assert "capital_structure" not in market
    assert market["price_target"] == {
        "currency": "GBp", "history_compatible": True, "mean": 121, "high": 155, "current": 101.75,
    }
    market = fetch_company_market(
        "VOD.L",
        {"currency": "GBP",
         "annual": [{"date": "2025-03-31", "values": {"cash": 8e9, "total_debt": 44e9}}],
         "quarterly": [{"date": "2025-09-30", "values": {"cash": 9e9, "total_debt": 45e9}}]},
        handle=SimpleNamespace(),
        info={**info, "financialCurrency": "GBP", "regularMarketPrice": 1.0175},
    )
    assert market["capital_structure"] == {
        "currency": "GBP", "balance_date": "2025-09-30",
        "market_cap": 23e9, "enterprise_value": 76e9, "cash": 9e9, "debt": 45e9,
    }
    assert "price_target" not in market


def test_valuation_preserves_yahoo_history_when_a_ratio_is_missing():
    def measures(freq, periods):
        assert periods == 5
        if freq == "quarterly":
            return pd.DataFrame()
        return pd.DataFrame(
            {"Current": [30, 7], "12/31/2025": [32, float("nan")], "12/31/2024": [28, 6]},
            index=["Trailing P/E", "Price/Sales"],
        )
    market = fetch_company_market(
        "T", None, handle=SimpleNamespace(get_valuation_measures=measures), info={},
    )
    assert market["valuation"] == {
        "annual": [{"date": "2024-12-31", "pe": 28, "ps": 6}, {"date": "2025-12-31", "pe": 32}],
        "current": {"pe": 30, "ps": 7},
    }


def test_earnings_skip_zero_placeholders_and_mismatched_eps_methods():
    statements = {
        "currency": "EUR",
        "annual": [{"date": "2025-12-31", "values": {"revenue": 75, "diluted_eps": 3}}],
        "quarterly": [{"date": "2025-12-31", "values": {"revenue": 20}}],
    }
    handle = SimpleNamespace(
        earnings_history=pd.DataFrame(
            {"epsActual": [0.8], "epsEstimate": [0.7], "methodology": ["normalized"]},
            index=pd.to_datetime(["2025-12-31"]),
        ),
        earnings_estimate=pd.DataFrame(
            {"avg": [4, 0.9], "methodology": ["gaap", "gaap"], "currency": ["EUR", "EUR"]},
            index=["0y", "0q"],
        ),
        revenue_estimate=pd.DataFrame(
            {"avg": [90, 0, 24], "numberOfAnalysts": [2, 0, 1], "currency": ["EUR"] * 3},
            index=["0y", "0q", "+1q"],
        ),
    )
    earnings = fetch_company_market("T", statements, handle=handle, info={})["earnings"]
    assert earnings["annual"] == [
        {"date": "2025-12-31", "label": "2025", "revenue_actual": 75, "eps_actual": 3},
        {"label": "Current FY", "revenue_estimate": 90, "eps_estimate": 4},
    ]
    assert earnings["quarterly"] == [
        {"date": "2025-12-31", "label": "2025-12-31", "revenue_actual": 20,
         "eps_actual": 0.8, "eps_estimate": 0.7},
        {"label": "Next quarter", "revenue_estimate": 24},
    ]
