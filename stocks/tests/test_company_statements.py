from types import SimpleNamespace

import pandas as pd
import pytest

from src.company_statements import fetch_company_statements


def statement(rows):
    return pd.DataFrame(rows).rename(columns=pd.Timestamp)


def test_statement_series_align_periods_and_reconcile_reported_totals():
    annual_income = statement({
        "2024-12-31": {"TotalRevenue": 70, "NetIncome": 0, "GrossProfit": float("nan")},
        "2025-12-31": {
            "TotalRevenue": 100, "GrossProfit": 62, "OperatingIncome": 20,
            "PretaxIncome": 18, "NetIncome": 15, "DilutedEPS": 0.75,
        },
    })
    quarterly_income = statement({"2025-12-31": {"TotalRevenue": 30, "NetIncome": -2}})
    annual_cash = statement({"2025-12-31": {"FreeCashFlow": -4}})
    handle = SimpleNamespace(
        get_income_stmt=lambda freq, pretty: annual_income if freq == "yearly" else quarterly_income,
        get_cashflow=lambda freq, pretty: annual_cash if freq == "yearly" else pd.DataFrame(),
    )
    balances = {
        "currency": "USD",
        "annual": [
            {"date": "2025-12-31", "values": {"total_debt": 17, "cash_and_equivalents": 4}},
            {"date": "2024-12-31", "values": {"cash": 85}},
        ],
        "quarterly": [
            {"date": "2025-09-30", "values": {"current_assets": 13, "current_liabilities": 4}},
        ],
    }

    data = fetch_company_statements("TEST", balances, handle=handle, info={"financialCurrency": "EUR"})
    assert data["currency"] == "EUR"
    latest, older = data["annual"]
    assert latest == {
        "date": "2025-12-31",
        "values": {
            "revenue": 100, "net_income": 15, "gross_profit": 62, "operating_income": 20,
            "diluted_eps": 0.75, "net_margin_pct": 15, "cost_of_revenue": 38,
            "operating_expenses": 42, "non_operating_income": -2, "taxes_and_other": 3,
            "free_cash_flow": -4, "cash": 4, "total_debt": 17,
        },
    }
    assert older == {"date": "2024-12-31", "values": {"revenue": 70, "net_income": 0, "net_margin_pct": 0}}
    recent_quarter, prior_quarter = data["quarterly"]
    assert recent_quarter["values"] == {
        "revenue": 30, "net_income": -2, "net_margin_pct": pytest.approx(-20 / 3),
    }
    assert prior_quarter == {"date": "2025-09-30", "values": {"current_assets": 13, "current_liabilities": 4}}


def test_cash_flow_can_survive_an_income_statement_error():
    def missing_statement(**kwargs):
        raise RuntimeError

    handle = SimpleNamespace(
        get_income_stmt=missing_statement,
        get_cashflow=lambda **kwargs: (
            statement({"2025-12-31": {"FreeCashFlow": 0}}) if kwargs["freq"] == "yearly" else pd.DataFrame()
        ),
    )
    data = fetch_company_statements("TEST", None, handle=handle, info={"currency": "USD"})
    assert data == {
        "currency": "",
        "annual": [{"date": "2025-12-31", "values": {"free_cash_flow": 0}}],
        "quarterly": [],
    }


def test_empty_statements_return_no_payload():
    handle = SimpleNamespace(get_income_stmt=lambda **kwargs: None, get_cashflow=lambda **kwargs: pd.DataFrame())
    assert fetch_company_statements("TEST", None, handle=handle, info={}) is None
