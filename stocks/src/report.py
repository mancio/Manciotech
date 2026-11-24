"""Render the final standalone report.html from the Jinja2 template."""
from __future__ import annotations

import math
from datetime import date, datetime, timezone
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from . import config
from .fundamentals import LINE_ITEM_LABELS
from .ratings import BUCKET_LABEL, BUCKET_ORDER

_RATING_CLASS = {
    "Strong Buy": "r-strongbuy",
    "Buy": "r-buy",
    "Hold": "r-hold",
    "Sell": "r-sell",
    "Strong Sell": "r-strongsell",
}

TEMPLATE_DIR = config.ROOT / "templates"
OUTPUT_PATH = config.ROOT / "report.html"


def latest_debt(row: dict) -> dict | None:
    """Most recent reported debt across annual and interim balance sheets."""
    latest = None
    sources = [row.get("fundamentals"), (row.get("finance") or {}).get("statements")]
    for source in sources:
        if not source:
            continue
        for frequency in ("quarterly", "annual"):
            for period in source.get(frequency, []):
                value = period.get("values", {}).get("total_debt")
                try:
                    reported = date.fromisoformat(period.get("date", ""))
                except (TypeError, ValueError):
                    continue
                if (isinstance(value, bool) or not isinstance(value, (int, float))
                        or not math.isfinite(value) or value < 0
                        or reported > datetime.now(timezone.utc).date()):
                    continue
                if latest is None or reported.isoformat() > latest["date"]:
                    latest = {"value": value, "date": reported.isoformat(),
                              "currency": source.get("currency") or ""}
    return latest


def format_debt(debt: dict | None) -> str:
    if debt is None:
        return "n/a"
    value = debt["value"]
    for divisor, suffix in ((1e12, "T"), (1e9, "B"), (1e6, "M"), (1e3, "K"), (1, "")):
        if value >= divisor or divisor == 1:
            amount = f"{value / divisor:.2f}{suffix}"
            return f"{amount} {debt['currency']}".strip()


def _detail_payload(row: dict) -> dict:
    """Per-ticker data for the detail panel. Only keys the source actually gave."""
    counts = row.get("rating_counts") or {}
    buckets = [
        {"key": b, "label": BUCKET_LABEL[b], "count": int(counts.get(b, 0) or 0)}
        for b in BUCKET_ORDER
        if b in counts
    ]
    fundamentals = row.get("fundamentals")
    return {
        "ticker": row["ticker"],
        "name": row["name"],
        "market": row["market"],
        "score": row.get("score"),
        "last_close": row["last_close"],
        "support": row["support"],
        "distance_pct": row["distance_pct"],
        "high_52w": row["high_52w"],
        "drawdown_pct": row["drawdown_pct"],
        "days_since_high": row["days_since_high"],
        "rating": row["rating"],
        "rating_class": row["rating_class"],
        "num_analysts": row["num_analysts"],
        "community": row.get("community"),
        "demand": row.get("demand"),
        "short_pct": row.get("short_pct"),
        "reasons": row.get("reasons", ""),
        "buckets": buckets,
        "fundamentals": fundamentals,
        "debt_now": row.get("debt_now"),
        "finance": row.get("finance"),
    }


def render_report(rows: list[dict], out_path: Path = OUTPUT_PATH) -> Path:
    """Render `rows` to a self-contained report.html and return its path.

    Each row dict must contain: ticker, name, market, last_close, support,
    distance_pct, high_52w, drawdown_pct, days_since_high, rating, num_analysts.
    Optional: rating_counts, fundamentals, and finance (company charts).
    """
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        autoescape=select_autoescape(["html", "xml", "j2"]),
    )
    env.filters["debt_money"] = format_debt
    template = env.get_template("report.html.j2")

    enriched = []
    for r in rows:
        r = dict(r)
        r["rating_class"] = _RATING_CLASS.get(r["rating"], "r-hold")
        r["debt_now"] = latest_debt(r)
        enriched.append(r)

    us_count = sum(1 for r in enriched if r["market"] == "US")
    eu_count = sum(1 for r in enriched if r["market"] == "EU")

    generated = datetime.now(timezone.utc)
    html = template.render(
        rows=enriched,
        details={r["ticker"]: _detail_payload(r) for r in enriched},
        line_items=LINE_ITEM_LABELS,
        row_count=len(enriched),
        us_count=us_count,
        eu_count=eu_count,
        threshold=config.NEAR_THRESHOLD_PCT,
        generated_utc=generated.strftime("%Y-%m-%d %H:%M:%S"),
        generated_iso=generated.strftime("%Y-%m-%dT%H:%M:%SZ"),
    )
    out_path.write_text(html, encoding="utf-8")
    return out_path


if __name__ == "__main__":
    demo = [
        {
            "ticker": "DEMO",
            "name": "Demo Corp",
            "market": "US",
            "last_close": 100.0,
            "support": 97.5,
            "distance_pct": 2.5,
            "high_52w": 140.0,
            "drawdown_pct": 28.57,
            "days_since_high": 42,
            "rating": "Buy",
            "num_analysts": 25,
        }
    ]
    path = render_report(demo)
    print(f"Wrote {path}")

