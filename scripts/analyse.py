"""Build the "typical day" model and export JSON for the website.

For each rail, on the log of daily volume:
  expected = slow trend + day-of-week effect (per year) + day-of-month effect
- Trend: centred 29-day rolling median, after removing the weekly and monthly
  effects, with event days left out so festivals don't flatten themselves.
- Day-of-week effect: median gap from trend by weekday, for each calendar year
  (habits change: UPI weekends look different in 2021 and 2026).
- Day-of-month effect: median gap from trend by day of month (salary days).
A day's difference = actual / expected - 1. Its strength = that gap divided
by the rail's typical day-to-day noise (median absolute deviation).

Outputs (web/public/data/):
  rails.json    rail ids, names, colours, units, first and last day
  daily.json    per rail: dates, actual, expected, diff (compact arrays)
  rhythms.json  weekday, day-of-month and month-of-year patterns per rail
  events.json   every calendar event with each rail's difference that day
  meta.json     date range, sources, build time
"""
import json
import pathlib
import shutil
from datetime import datetime, timezone

import numpy as np
import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parent.parent
CLEAN = ROOT / "data" / "clean"
EVENTS = ROOT / "data" / "events.csv"
OUT = ROOT / "web" / "public" / "data"

# Rails shown on the site, in display order, with short names
RAILS = [
    ("upi", "UPI", "Phone payments (UPI)"),
    ("atm", "ATM cash", "ATM cash withdrawals"),
    ("netc", "FASTag", "FASTag toll payments"),
    ("debit_card", "Debit cards", "Debit card payments, shops and online"),
    ("credit_card", "Credit cards", "Credit card payments, shops and online"),
    ("imps", "IMPS", "Instant bank transfers (IMPS)"),
    ("neft", "NEFT", "Bank transfers (NEFT)"),
    ("bbps", "Bills", "Bill payments (BBPS)"),
    ("nach_credit", "Salaries & benefits", "Bulk credits: salaries, pensions, subsidies (NACH)"),
    ("nach_debit", "EMIs & SIPs", "Auto-debits: loan EMIs, SIPs, insurance (NACH)"),
    ("micro_atm", "Village cash", "Cash at micro-ATMs and banking agents (AePS)"),
    ("cts", "Cheques", "Cheques cleared (CTS)"),
]
WINDOW = 29


def model_rail(s, event_days):
    """s: daily volume Series (DatetimeIndex, may have gaps). Returns DataFrame."""
    s = s[s > 0].asfreq("D")
    y = np.log(s)
    fit = y.copy()
    fit[fit.index.isin(event_days)] = np.nan  # leave events out of the baseline
    dow = pd.Series(0.0, index=y.index)
    dom = pd.Series(0.0, index=y.index)
    for _ in range(3):  # alternate between trend and calendar effects
        trend = (fit - dow - dom).rolling(WINDOW, center=True, min_periods=10).median()
        trend = trend.interpolate(limit_direction="both")
        r = fit - trend
        dow_tab = r.groupby([r.index.year, r.index.dayofweek]).median()
        dow = pd.Series([dow_tab.get((d.year, d.dayofweek), 0.0) for d in y.index], index=y.index).fillna(0.0)
        r2 = fit - trend - dow
        dom_tab = r2.groupby(r2.index.day).median()
        dom = pd.Series(y.index.day.map(dom_tab).values, index=y.index).fillna(0.0)
    expected = trend + dow + dom
    gap = y - expected
    noise = gap.where(~gap.index.isin(event_days)).abs().rolling(365, center=True, min_periods=60).median()
    noise = noise.reindex(gap.index).interpolate(limit_direction="both").clip(lower=0.01) * 1.4826
    out = pd.DataFrame({"actual": s, "expected": np.exp(expected), "diff": np.exp(gap) - 1, "z": gap / noise,
                        "trend": np.exp(trend), "dow": dow, "dom": dom})
    return out.dropna(subset=["actual"])


def rhythms(df):
    """Weekday, day-of-month and month-of-year patterns as % vs typical."""
    weekday = {}
    for year, g in df.groupby(df.index.year):
        tab = g["dow"].groupby(g.index.dayofweek).median()
        weekday[int(year)] = [round(float(np.exp(tab.get(i, np.nan)) - 1) * 100, 1) if i in tab else None for i in range(7)]
    dom_tab = df["dom"].groupby(df.index.day).median()
    day_of_month = [round(float(np.exp(dom_tab.get(d, 0)) - 1) * 100, 1) for d in range(1, 32)]
    # month-of-year: monthly average vs a centred 12-month average, median across years
    m = df["actual"].resample("MS").mean()
    ratio = (m / m.rolling(12, center=True, min_periods=12).mean()).dropna()
    moy = ratio.groupby(ratio.index.month).median()
    month = [round(float(moy.get(i, np.nan) - 1) * 100, 1) if i in moy else None for i in range(1, 13)]
    return {"weekday_by_year": weekday, "day_of_month": day_of_month, "month_of_year": month}


def r(x, nd=2):
    return None if x is None or (isinstance(x, float) and not np.isfinite(x)) else round(float(x), nd)


def main():
    daily = pd.read_csv(CLEAN / "daily.csv", parse_dates=["date"])
    events = pd.read_csv(EVENTS, parse_dates=["date"])
    event_days = set(events.loc[events.type != "context", "date"])
    # Diwali season and New Year span a few days: keep their neighbours out of the baseline too
    for d in list(events.loc[events.event.isin(["Diwali", "Holi", "Dhanteras"]), "date"]):
        event_days.update(d + pd.Timedelta(days=k) for k in range(-3, 4))
    OUT.mkdir(parents=True, exist_ok=True)

    rails_meta, daily_json, rhythm_json, models = [], {}, {}, {}
    for rid, short, long in RAILS:
        s = daily.loc[daily.rail == rid].set_index("date")["volume_lakh"]
        m = model_rail(s, event_days)
        models[rid] = m
        rails_meta.append({"id": rid, "short": short, "name": long, "unit": "lakh transactions",
                           "first": m.index.min().strftime("%Y-%m-%d"), "last": m.index.max().strftime("%Y-%m-%d")})
        daily_json[rid] = {
            "start": m.index.min().strftime("%Y-%m-%d"),
            "dates": [d.strftime("%Y-%m-%d") for d in m.index],
            "actual": [r(v) for v in m.actual], "expected": [r(v) for v in m.expected],
            "diff": [r(v * 100, 1) for v in m["diff"]], "z": [r(v, 1) for v in m.z],
        }
        rhythm_json[rid] = rhythms(m)

    ev_out = []
    for _, e in events[events.type != "context"].iterrows():
        row = {"date": e.date.strftime("%Y-%m-%d"), "event": e.event, "chapter": e.chapter, "type": e.type,
               "source": e.source, "confidence": e.confidence, "rails": {}}
        for rid, m in models.items():
            if e.date in m.index:
                row["rails"][rid] = {"diff": r(m.at[e.date, "diff"] * 100, 1), "z": r(m.at[e.date, "z"], 1)}
        if row["rails"]:
            ev_out.append(row)

    # unexplained strong days: |z| >= 4 on UPI, ATM or FASTag, not within a day of a calendar event
    near = set()
    for d in event_days:
        near.update(d + pd.Timedelta(days=k) for k in (-1, 0, 1))
    unexplained = []
    for rid in ("upi", "atm", "netc"):
        m = models[rid]
        hits = m[(m.z.abs() >= 4) & ~m.index.isin(near)]
        for d, row in hits.iterrows():
            unexplained.append({"date": d.strftime("%Y-%m-%d"), "rail": rid, "diff": r(row["diff"] * 100, 1), "z": r(row.z, 1)})
    unexplained.sort(key=lambda x: -abs(x["z"]))

    dates = daily.date
    meta = {"first": dates.min().strftime("%Y-%m-%d"), "last": dates.max().strftime("%Y-%m-%d"),
            "built": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "sources": [
                {"name": "Reserve Bank of India, Payment Systems - Daily Data Publication",
                 "url": "https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=49901"},
                {"name": "India Data Portal (copy of the RBI data, used as a cross-check)",
                 "url": "https://ckandev.indiadataportal.com/dataset/reserve-bank-of-india"},
                {"name": "Holiday dates: python-holidays (India public and optional lists)",
                 "url": "https://github.com/vacanza/holidays"},
                {"name": "Sport, Budget and election dates: Wikipedia (linked on each event)",
                 "url": "https://en.wikipedia.org"},
            ]}

    def dump(name, obj):
        (OUT / name).write_text(json.dumps(obj, separators=(",", ":"), allow_nan=False))
        print(f"{name}: {(OUT / name).stat().st_size / 1024:.0f} KB")

    dump("rails.json", rails_meta)
    dump("daily.json", daily_json)
    dump("rhythms.json", rhythm_json)
    dump("events.json", ev_out)
    dump("unexplained.json", unexplained[:60])
    dump("meta.json", meta)
    dl = OUT.parent / "downloads"
    dl.mkdir(exist_ok=True)
    shutil.copy(CLEAN / "daily.csv", dl / "daily.csv")
    shutil.copy(EVENTS, dl / "events.csv")

    # a quick look at results for the build log
    up = models["upi"]
    print("UPI typical-day error (median |diff|, %):", round(float(up["diff"].abs().median() * 100), 2))
    show = [e for e in ev_out if e["event"] in ("Diwali", "Dhanteras", "Holi", "Cricket World Cup final (India v Australia)",
                                                "T20 World Cup final (India win)", "New Year's Eve")]
    for e in show[-14:]:
        print(e["date"], e["event"][:30].ljust(30), {k: e["rails"].get(k, {}).get("diff") for k in ("upi", "atm", "netc", "debit_card")})


if __name__ == "__main__":
    main()
