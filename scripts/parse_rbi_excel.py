"""Parse RBI's daily payment-systems workbook into one flat table.

Input:  data/raw/PSDDP04062020.xlsx, downloaded by hand from
        https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=49901
        (one sheet per month; header rows name each system; "h" = holiday).
Output: data/raw/rbi_daily_excel.csv with the same column names as
        data/raw/rbi_daily.csv (e.g. upi_vol, upi_val).
"""
import pathlib
import re
from datetime import datetime

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "raw" / "PSDDP04062020.xlsx"
OUT = ROOT / "data" / "raw" / "rbi_daily_excel.csv"

SYSTEMS = [  # (pattern on the header name, column stem); first match wins
    (r"^RTGS", "rtgs"), (r"^NEFT", "neft"), (r"^AePS \(through", "aeps_through_micro_atms_or_bcs"),
    (r"^AePS", "aeps"), (r"^UPI", "upi"), (r"^IMPS", "imps"), (r"^NACH Credit", "nach_credit"),
    (r"^NACH Debit", "nach_debit"), (r"^NETC", "netc"), (r"^BBPS", "bbps"), (r"^CTS", "cts"),
    (r"^NFS", "nfs_through_atms"), (r"^Credit Card", "credit_card"), (r"^Debit Card", "debit_card"),
    (r"^Prepaid", "ppis_card"),
]


def to_date(v):
    if isinstance(v, (pd.Timestamp, datetime)):
        return pd.Timestamp(v).normalize()
    if isinstance(v, str) and re.match(r"^[A-Z][a-z]+ \d{1,2}, \d{4}$", v.strip()):
        return pd.Timestamp(pd.to_datetime(v.strip(), format="%B %d, %Y"))
    return None


def stem_for(system):
    for pat, stem in SYSTEMS:
        if re.search(pat, system):
            return stem
    return None


def parse_sheet(df):
    dates = df.iloc[:, 0].map(to_date)
    first = dates.first_valid_index()
    if first is None:
        return None
    measure_row = first - 1
    system_row = 4
    cols = {}
    system = sub = None
    for c in range(1, df.shape[1]):
        s = df.iat[system_row, c]
        if isinstance(s, str) and s.strip():
            system, sub = s.strip(), None
        if measure_row > system_row + 1:  # a sub-header row exists (cards: at PoS / at e-Commerce)
            sv = df.iat[system_row + 1, c]
            if isinstance(sv, str) and sv.strip():
                sub = sv.strip()
        m = df.iat[measure_row, c]
        if system is None or m not in ("Vol", "Val"):
            continue
        stem = stem_for(system)
        if stem is None:
            continue
        if stem in ("credit_card", "debit_card", "ppis_card"):
            if sub and "PoS" in sub:
                stem += "_at_pos"
            elif sub and "Commerce" in sub:
                stem += "_at_e_commerce"
            else:
                stem += "_at_pos_and_e_commerce"
        cols[c] = f"{stem}_{m.lower()}"
    rows = df.loc[dates.notna()]
    out = pd.DataFrame({"date": dates[dates.notna()]})
    for c, name in cols.items():
        out[name] = pd.to_numeric(rows.iloc[:, c], errors="coerce")  # "h" (holiday) -> empty
    return out


def main():
    book = pd.read_excel(SRC, sheet_name=None, header=None)
    parts = [p for p in (parse_sheet(df) for df in book.values()) if p is not None]
    out = pd.concat(parts).drop_duplicates("date", keep="last").sort_values("date")
    out.to_csv(OUT, index=False)
    print(f"{len(book)} sheets -> {len(out)} days, {out.date.min():%d %b %Y} to {out.date.max():%d %b %Y}")
    print("columns:", ", ".join(out.columns[1:]))


if __name__ == "__main__":
    main()
