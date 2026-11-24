"""Download RBI's daily payment-system data from the India Data Portal API.

Source: Reserve Bank of India settlement data, republished by India Data Portal
(resource 1f9367ac-01b0-4c82-83a1-4069d4340667). Volumes are in lakh
transactions, values in crore rupees.
"""
import json
import pathlib
import urllib.request

import pandas as pd

API = "https://ckandev.indiadataportal.com/api/3/action/datastore_search"
RESOURCE = "1f9367ac-01b0-4c82-83a1-4069d4340667"
OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw" / "rbi_daily.csv"


def main():
    rows, offset = [], 0
    while True:
        url = f"{API}?resource_id={RESOURCE}&limit=1000&offset={offset}&sort=date%20asc"
        with urllib.request.urlopen(url, timeout=120) as r:
            res = json.load(r)["result"]
        rows += res["records"]
        offset += 1000
        if offset >= res["total"]:
            break
    df = pd.DataFrame(rows).drop(columns=["_id", "id"], errors="ignore")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT, index=False)
    print(f"{len(df)} rows, {df['date'].min()} to {df['date'].max()} -> {OUT}")


if __name__ == "__main__":
    main()
