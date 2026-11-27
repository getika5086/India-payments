"""Build the event calendar (data/events.csv).

Two kinds of rows:
1. Holidays and festivals from the `holidays` package (India, public + optional
   lists, which follow the central government's gazetted and restricted
   holiday lists).
2. Hand-entered national moments (sport, Budget, elections, ...). Each has a
   Wikipedia page; the script downloads the page's wikitext and marks the row
   "confirmed" only if the date appears on that page, otherwise "to verify".
"""
import pathlib
import re
import time
import urllib.parse
import urllib.request
from datetime import date

import holidays
import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / "data" / "raw" / "wiki_cache"
OUT = ROOT / "data" / "events.csv"
YEARS = range(2020, 2027)
UA = "india-payment-calendar/0.1 (open-data research script)"
HOLIDAYS_SRC = "https://github.com/vacanza/holidays (India: central government holiday lists)"

# --- festivals and national days kept from the holidays package -------------
# pattern in holiday name -> (event name, chapter, type)
KEEP = [
    (r"^Republic Day", "Republic Day", "C3", "civic"),
    (r"^Independence Day", "Independence Day", "C3", "civic"),
    (r"Gandhi's Jayanti", "Gandhi Jayanti", "C3", "civic"),
    (r"^Holi$", "Holi", "C2", "festival"),
    (r"Holika Dahan", "Holika Dahan", "C2", "festival"),
    (r"Id-ul-Fitr", "Eid al-Fitr", "C2", "festival"),
    (r"Id-ul-Zuha", "Eid al-Adha (Bakrid)", "C2", "festival"),
    (r"Raksha Bandhan", "Raksha Bandhan", "C2", "festival"),
    (r"Janmashtami \(Vaishnava\)", "Janmashtami", "C2", "festival"),
    (r"Ganesh Chaturthi", "Ganesh Chaturthi", "C2", "festival"),
    (r"Dussehra \(Mahashtami\)", "Durga Ashtami", "C2", "festival"),
    (r"^Dussehra$", "Dussehra", "C2", "festival"),
    (r"^Diwali", "Diwali", "C2", "festival"),
    (r"Govardhan Puja", "Govardhan Puja (day after Diwali)", "C2", "festival"),
    (r"Bhai Duj", "Bhai Dooj", "C2", "festival"),
    (r"Chhath", "Chhath Puja", "C2", "festival"),
    (r"Makar Sankranti", "Makar Sankranti", "C2", "festival"),
    (r"^Pongal|; Pongal", "Pongal", "C2", "festival"),
    (r"^Onam", "Onam", "C2", "festival"),
    (r"Guru Nanak", "Guru Nanak Jayanti", "C2", "festival"),
    (r"^Christmas$", "Christmas", "C2", "festival"),
    (r"Maha Shivaratri", "Maha Shivaratri", "C2", "festival"),
    (r"Ram Navami", "Ram Navami", "C2", "festival"),
    (r"Good Friday", "Good Friday", "C2", "festival"),
]

# --- hand-entered national moments ------------------------------------------
# (date, event, chapter, type, wikipedia page)
MANUAL = [
    # Cricket: IPL finals
    ("2020-11-10", "IPL final", "C3", "sport", "2020 Indian Premier League"),
    ("2021-10-15", "IPL final", "C3", "sport", "2021 Indian Premier League"),
    ("2022-05-29", "IPL final", "C3", "sport", "2022 Indian Premier League final"),
    ("2023-05-29", "IPL final (reserve day)", "C3", "sport", "2023 Indian Premier League final"),
    ("2024-05-26", "IPL final", "C3", "sport", "2024 Indian Premier League final"),
    ("2025-06-03", "IPL final", "C3", "sport", "2025 Indian Premier League final"),
    # Cricket: ICC finals with India playing
    ("2023-11-19", "Cricket World Cup final (India v Australia)", "C3", "sport", "2023 Cricket World Cup final"),
    ("2024-06-29", "T20 World Cup final (India win)", "C3", "sport", "2024 ICC Men's T20 World Cup final"),
    ("2025-03-09", "Champions Trophy final (India win)", "C3", "sport", "2025 ICC Champions Trophy final"),
    # Cricket: India v Pakistan, major tournaments
    ("2021-10-24", "India v Pakistan, T20 World Cup", "C3", "sport", "2021 ICC Men's T20 World Cup"),
    ("2022-08-28", "India v Pakistan, Asia Cup", "C3", "sport", "2022 Asia Cup"),
    ("2022-10-23", "India v Pakistan, T20 World Cup", "C3", "sport", "2022 ICC Men's T20 World Cup"),
    ("2023-10-14", "India v Pakistan, World Cup", "C3", "sport", "2023 Cricket World Cup"),
    ("2024-06-09", "India v Pakistan, T20 World Cup", "C3", "sport", "2024 ICC Men's T20 World Cup"),
    ("2025-02-23", "India v Pakistan, Champions Trophy", "C3", "sport", "2025 ICC Champions Trophy"),
    # Union Budget
    ("2021-02-01", "Union Budget", "C3", "civic", "2021 Union budget of India"),
    ("2022-02-01", "Union Budget", "C3", "civic", "2022 Union budget of India"),
    ("2023-02-01", "Union Budget", "C3", "civic", "2023 Union budget of India"),
    ("2024-02-01", "Interim Union Budget", "C3", "civic", "2024 Union budget of India"),
    ("2024-07-23", "Union Budget", "C3", "civic", "2024 Union budget of India"),
    ("2025-02-01", "Union Budget", "C3", "civic", "2025 Union budget of India"),
    # 2024 general election
    ("2024-04-19", "Lok Sabha polling, phase 1", "C3", "civic", "2024 Indian general election"),
    ("2024-04-26", "Lok Sabha polling, phase 2", "C3", "civic", "2024 Indian general election"),
    ("2024-05-07", "Lok Sabha polling, phase 3", "C3", "civic", "2024 Indian general election"),
    ("2024-05-13", "Lok Sabha polling, phase 4", "C3", "civic", "2024 Indian general election"),
    ("2024-05-20", "Lok Sabha polling, phase 5", "C3", "civic", "2024 Indian general election"),
    ("2024-05-25", "Lok Sabha polling, phase 6", "C3", "civic", "2024 Indian general election"),
    ("2024-06-01", "Lok Sabha polling, phase 7", "C3", "civic", "2024 Indian general election"),
    ("2024-06-04", "Lok Sabha results day", "C3", "civic", "2024 Indian general election"),
    # Festivals not in the holiday lists
    ("2020-11-13", "Dhanteras", "C2", "festival", "Dhanteras"),
    ("2021-11-02", "Dhanteras", "C2", "festival", "Dhanteras"),
    ("2022-10-23", "Dhanteras", "C2", "festival", "Dhanteras"),
    ("2023-11-10", "Dhanteras", "C2", "festival", "Dhanteras"),
    ("2024-10-29", "Dhanteras", "C2", "festival", "Dhanteras"),
    ("2025-10-18", "Dhanteras", "C2", "festival", "Dhanteras"),
    ("2026-11-06", "Dhanteras", "C2", "festival", "Dhanteras"),
    ("2021-05-14", "Akshaya Tritiya", "C2", "festival", "Akshaya Tritiya"),
    ("2022-05-03", "Akshaya Tritiya", "C2", "festival", "Akshaya Tritiya"),
    ("2023-04-22", "Akshaya Tritiya", "C2", "festival", "Akshaya Tritiya"),
    ("2024-05-10", "Akshaya Tritiya", "C2", "festival", "Akshaya Tritiya"),
    ("2025-04-30", "Akshaya Tritiya", "C2", "festival", "Akshaya Tritiya"),
    # Context periods (excluded from the typical-day baseline, not cards)
    ("2021-04-15", "COVID-19 second wave (start of state lockdowns, approx.)", "context", "context", "COVID-19 pandemic in India"),
]

DATE_FORMATS = ["{d} {B} {Y}", "{B} {d}, {Y}", "{Y}-{m:02d}-{d:02d}", "{d} {b} {Y}"]


def wiki_raw(title):
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / (re.sub(r"[^A-Za-z0-9]+", "_", title) + ".txt")
    if f.exists():
        text = f.read_text()
    else:
        text = _download(title, f)
    m = re.match(r"#REDIRECT\s*\[\[([^\]#]+)", text, re.I)
    return wiki_raw(m.group(1)) if m else text


def _download(title, f):
    url = "https://en.wikipedia.org/w/index.php?" + urllib.parse.urlencode({"title": title, "action": "raw"})
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                text = r.read().decode("utf-8")
            f.write_text(text)
            time.sleep(2)
            return text
        except Exception as e:  # rate limits or missing page
            print(f"  {title}: {e}; retry {attempt + 1}")
            time.sleep(10 * (attempt + 1))
    return ""


def date_on_page(d, text):
    names = dict(B=d.strftime("%B"), b=d.strftime("%b"), Y=d.year, d=d.day, m=d.month)
    if any(fmt.format(**names) in text for fmt in DATE_FORMATS):
        return True
    # festival infoboxes list dates as "| date2024 = 29 October"
    pat = rf"date{d.year}\s*=\s*{d.day}\s+{d.strftime('%B')}"
    return re.search(pat, text) is not None


def main():
    rows = []
    h = holidays.India(years=YEARS, categories=("public", "optional"))
    for d, name in sorted(h.items()):
        for part in name.split("; "):
            for pat, label, ch, typ in KEEP:
                if re.search(pat, part):
                    rows.append(dict(date=d.isoformat(), event=label, chapter=ch, type=typ,
                                     source=HOLIDAYS_SRC, confidence="confirmed"))
                    break
    for ds, label, ch, typ, page in MANUAL:
        text = wiki_raw(page)
        ok = bool(text) and date_on_page(date.fromisoformat(ds), text)
        rows.append(dict(date=ds, event=label, chapter=ch, type=typ,
                         source="https://en.wikipedia.org/wiki/" + page.replace(" ", "_"),
                         confidence="confirmed" if ok else "to verify"))
    # The day before Diwali (Lakshmi Puja), by definition
    for d in [r["date"] for r in rows if r["event"] == "Diwali"]:
        prev = (date.fromisoformat(d) - pd.Timedelta(days=1)).isoformat()
        rows.append(dict(date=prev, event="Day before Diwali", chapter="C2", type="festival",
                         source="calendar date (day before Diwali)", confidence="confirmed"))
    # New Year's Eve, by definition
    for y in YEARS:
        rows.append(dict(date=f"{y}-12-31", event="New Year's Eve", chapter="C2", type="festival",
                         source="calendar date", confidence="confirmed"))
    df = pd.DataFrame(rows).drop_duplicates(["date", "event"]).sort_values(["date", "event"])
    df.to_csv(OUT, index=False)
    print(df.groupby(["type", "confidence"]).size().to_string())
    print(df[df.confidence != "confirmed"].to_string(index=False))


if __name__ == "__main__":
    main()
