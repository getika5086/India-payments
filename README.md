# India's Payment Calendar

An interactive website showing the rhythms of India's daily payments (weekdays,
salary week, festivals and national moments), built from public RBI data.

- `scripts/` — Python: download, clean and analyse the data
- `data/` — raw and cleaned data, event calendar, quality report
- `web/` — the website (Vite + React + TypeScript), deployed on Vercel

## Run the website locally

```bash
cd web
npm install
npm run dev
```

Then open http://localhost:5173.

## Deploy on Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project**, import the repository.
3. Set **Root Directory** to `web`. Vercel detects Vite; the build command is
   `npm run build` and the output folder is `dist` (also set in `web/vercel.json`).
4. Deploy. Every push to the main branch redeploys the site.

No database or environment variables are needed: the data ships with the site
as JSON files in `web/public/data/`.

## Refresh the data

1. Download RBI's daily payments workbook in a browser from the
   [RBI press release page](https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=49901)
   (`PSDDP04062020.xlsx`) and save it to `data/raw/`. RBI's site blocks scripts,
   so this step is manual.
2. Rebuild:

```bash
pip install -r requirements.txt
python3 scripts/parse_rbi_excel.py
python3 scripts/fetch_rbi_daily.py
python3 scripts/clean_daily.py
python3 scripts/build_events.py
python3 scripts/analyse.py
```

`analyse.py` writes the website's data to `web/public/data/` and the CSV
downloads to `web/public/downloads/`. Commit and push to redeploy.

## Data

| File | What it is |
| --- | --- |
| `data/raw/PSDDP04062020.xlsx` | RBI's daily payments workbook (main source) |
| `data/raw/rbi_daily_excel.csv` | The workbook flattened to one row per day |
| `data/raw/rbi_daily.csv` | India Data Portal copy, used as a cross-check and fallback |
| `data/clean/daily.csv` | One row per payment type per day: `date, rail, volume_lakh, value_crore` |
| `data/clean/quality_report.md` | Gaps, coverage and notes |
| `data/events.csv` | Event calendar: date, event, chapter, type, source, confidence |

Units: volumes in lakh transactions (1 lakh = 100,000); values in crore rupees (1 crore = 10 million).

## Method

For each payment type, a typical day = recent trend (29-day rolling median)
+ that year's day-of-week pattern + a day-of-month pattern, with event days
left out. Each day is compared with its typical day as a percentage, and
called out only when the gap is at least 2.5 times that payment type's
normal day-to-day spread. Details in `scripts/analyse.py`.

## Sources

- Reserve Bank of India, [Payment Systems - Daily Data Publication](https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=49901)
- [India Data Portal](https://ckandev.indiadataportal.com/dataset/reserve-bank-of-india) copy of the RBI data
- Holiday dates: [python-holidays](https://github.com/vacanza/holidays), India public and optional lists
- Sport, Budget and election dates: Wikipedia, linked per row in `data/events.csv`
