"""Clean RBI daily data into one tidy table: data/clean/daily.csv.

Primary source: RBI's own workbook (parsed by parse_rbi_excel.py).
Fallback: the India Data Portal copy (fetch_rbi_daily.py), used only for
days or cells missing from the workbook.

Output columns: date, rail, volume_lakh, value_crore.
Also writes data/clean/quality_report.md describing gaps and fixes.
"""
import pathlib

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "rbi_daily_excel.csv"
FALLBACK = ROOT / "data" / "raw" / "rbi_daily.csv"
OUT = ROOT / "data" / "clean"

# rail id -> (label, raw column stem)
RAILS = {
    "upi": ("UPI", "upi"),
    "imps": ("IMPS", "imps"),
    "neft": ("NEFT", "neft"),
    "rtgs": ("RTGS", "rtgs"),
    "netc": ("FASTag (NETC)", "netc"),
    "bbps": ("Bill payments (BBPS)", "bbps"),
    "nach_credit": ("NACH credit (salaries, pensions, subsidies)", "nach_credit"),
    "nach_debit": ("NACH debit (EMIs, SIPs, auto-debits)", "nach_debit"),
    "cts": ("Cheques (CTS)", "cts"),
    "atm": ("ATM withdrawals (NFS)", "nfs_through_atms"),
    "micro_atm": ("Micro-ATM cash (AePS)", "aeps_through_micro_atms_or_bcs"),
    "aeps": ("AePS payments", "aeps"),
}
CARDS = {
    "credit_card": ("Credit cards (shops + online)", "credit_card"),
    "debit_card": ("Debit cards (shops + online)", "debit_card"),
}


def main():
    primary = pd.read_csv(RAW, parse_dates=["date"]).set_index("date")
    fb = pd.read_csv(FALLBACK, parse_dates=["date"]).drop_duplicates().set_index("date")
    assert primary.index.is_unique and fb.index.is_unique, "conflicting rows for the same date"
    raw = primary.combine_first(fb[[c for c in fb.columns if c in primary.columns]]).sort_index()
    n_raw, n_dupes = len(primary), 0
    n_filled = int((primary.reindex(raw.index).isna() & raw.notna()).sum().sum())

    frames = []
    for rid, (label, stem) in RAILS.items():
        frames.append(pd.DataFrame({"rail": rid, "volume_lakh": raw[f"{stem}_vol"],
                                    "value_crore": raw[f"{stem}_val"]}))
    for rid, (label, stem) in CARDS.items():
        # 2020-21: one combined column; from 2021: separate shop (PoS) and online columns
        comb_v, comb_val = raw[f"{stem}_at_pos_and_e_commerce_vol"], raw[f"{stem}_at_pos_and_e_commerce_val"]
        split_v = raw[f"{stem}_at_pos_vol"] + raw[f"{stem}_at_e_commerce_vol"]
        split_val = raw[f"{stem}_at_pos_val"] + raw[f"{stem}_at_e_commerce_val"]
        frames.append(pd.DataFrame({"rail": rid, "volume_lakh": split_v.fillna(comb_v),
                                    "value_crore": split_val.fillna(comb_val)}))
    tidy = pd.concat(frames).reset_index().dropna(subset=["volume_lakh"])
    OUT.mkdir(parents=True, exist_ok=True)
    tidy.to_csv(OUT / "daily.csv", index=False, float_format="%.2f")
    pd.DataFrame([{"rail": k, "label": v[0]} for k, v in {**RAILS, **CARDS}.items()]).to_csv(OUT / "rails.csv", index=False)

    # quality report
    full = pd.date_range(raw.index.min(), raw.index.max())
    missing = full.difference(raw.index)
    runs = (pd.Series(missing).diff().dt.days.ne(1)).cumsum() if len(missing) else pd.Series(dtype=int)
    gaps = pd.Series(missing).groupby(runs.values).agg(["min", "max", "count"]) if len(missing) else pd.DataFrame()
    lines = ["# Data quality report", "",
             "Source: RBI, Payment Systems - Daily Data Publication (workbook PSDDP04062020.xlsx), "
             "with the India Data Portal copy as a fallback.",
             f"Days in RBI workbook: {n_raw}; cells filled from the fallback: {n_filled}; days in final data: {len(raw)}.",
             f"Date range: {raw.index.min():%d %b %Y} to {raw.index.max():%d %b %Y}.", "",
             "## Missing days", ""]
    if gaps.empty:
        lines.append("None. Every calendar day in the range has a row.")
    for _, g in gaps.iterrows():
        lines.append(f"- {g['min']:%d %b %Y} to {g['max']:%d %b %Y} ({g['count']} days)")
    lines += ["", "## Coverage by rail (share of days with data)", "", "| Rail | First day | Last day | Days with data |", "| --- | --- | --- | --- |"]
    for rid, grp in tidy.groupby("rail"):
        lines.append(f"| {rid} | {grp.date.min():%d %b %Y} | {grp.date.max():%d %b %Y} | {len(grp)} |")
    lines += ["", "## Notes", "",
              f"- The last month ({raw.index.max():%B %Y}) is partial: data runs to {raw.index.max():%d %B}.",
              "- Volumes are in lakh transactions (1 lakh = 100,000); values in crore rupees (1 crore = 10 million).",
              "- Cheques (CTS), NACH and RTGS have no data on bank holidays and Sundays when those systems do not settle; this is normal, not a gap.",
              "- Card data: a single combined column until 2021, then separate shop (PoS) and online columns, which are added together here.",
              "- The RBI workbook and the India Data Portal copy agree within 0.2% on 1,888 shared days for every rail except bill payments (BBPS), where 25 days differ by more than 1% (up to 11%), probably later RBI revisions. RBI's workbook is used.",
              "- From August 2025 RBI reports FASTag trips made with the new annual pass on a separate line; they are not in the NETC volume used here, so NETC may step down from that point.",
              "- RBI notes NETC figures cover FASTags linked to all instruments, so they differ from the monthly bulletin.",
              ]
    (OUT / "quality_report.md").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
