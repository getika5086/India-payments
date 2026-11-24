import { useEffect, useMemo, useState } from "react";
import type { Data } from "./data";
import { loadData } from "./data";
import { count, fmtDate, weekday } from "./format";
import { FESTIVALS, MOMENTS } from "./featured";
import { PICKER_RAILS } from "./rails";
import Timeline from "./components/Timeline";
import Heatmap from "./components/Heatmap";
import Rhythms from "./components/Rhythms";
import EventCard, { occurrences } from "./components/EventCard";
import DayExplorer from "./components/DayExplorer";
import Unexplained from "./components/Unexplained";
import Method from "./components/Method";

function RailPicker({ data, value, onChange, label }: { data: Data; value: string; onChange: (r: string) => void; label: string }) {
  return (
    <label className="picker">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {PICKER_RAILS.map((id) => {
          const r = data.rails.find((x) => x.id === id);
          return r ? <option key={id} value={id}>{r.name}</option> : null;
        })}
      </select>
    </label>
  );
}

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export default function App() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rail, setRail] = useState("upi");
  const [heatRail, setHeatRail] = useState("upi");
  const [year, setYear] = useState<number | null>(null);
  const [day, setDay] = useState<string | null>(null);

  useEffect(() => {
    loadData().then((d) => {
      setData(d);
      setYear(Number(d.meta.last.slice(0, 4)));
      setDay(d.events.filter((e) => e.event === "Dhanteras" && e.date <= d.meta.last).at(-1)?.date ?? d.meta.last);
    }).catch((e: Error) => setError(e.message));
  }, []);

  // open a shared card link (#card-name) once the data is in
  useEffect(() => {
    if (data && location.hash) setTimeout(() => scrollTo(location.hash.slice(1)), 50);
  }, [data]);

  const stats = useMemo(() => {
    if (!data) return null;
    const u = data.daily.upi;
    const firstYear = u.actual.slice(0, 30).reduce((a, b) => a + b, 0) / 30;
    const lastYear = u.actual.slice(-30).reduce((a, b) => a + b, 0) / 30;
    let best = 0;
    u.actual.forEach((v, i) => { if (v > u.actual[best]) best = i; });
    return { growth: lastYear / firstYear, recent: lastYear, best: { date: u.dates[best], v: u.actual[best] } };
  }, [data]);

  if (error) return <main className="wrap"><p className="error">Sorry, the data didn't load ({error}). Please refresh the page.</p></main>;
  if (!data || !stats || year === null || !day) return <main className="wrap"><p className="loading">Loading six years of payments…</p></main>;

  const pick = (d: string) => { setDay(d); setTimeout(() => scrollTo("explore"), 0); };
  const marks = [...FESTIVALS, ...MOMENTS].flatMap((f) => {
    const { main } = occurrences(data, f);
    return main ? [{ date: main.date, label: f.title }] : [];
  });
  const years = Array.from(new Set(data.daily[heatRail].dates.map((d) => Number(d.slice(0, 4)))));
  const rhythmYear = Number(data.meta.last.slice(0, 4)) - 1;

  return (
    <>
      <header className="hero">
        <div className="wrap">
          <p className="kicker">{fmtDate(data.meta.first)} to {fmtDate(data.meta.last)} · Reserve Bank of India data</p>
          <h1>India's Payment Calendar</h1>
          <p className="intro">
            Every day, India makes around <strong>{count(stats.recent)}</strong> UPI payments, {stats.growth.toFixed(0)} times as many as in mid-2020.
            Payments have a heartbeat: a weekly rhythm, a salary week, a festive season, and days when the whole country does the same thing at once.
            This is six years of that calendar, day by day.
          </p>
          <nav className="toc" aria-label="Chapters">
            <a href="#rhythms">1. Everyday rhythms</a>
            <a href="#festivals">2. Festivals</a>
            <a href="#moments">3. National moments</a>
            <a href="#year">4. A year in colour</a>
            <a href="#explore">5. Explore any day</a>
          </nav>
        </div>
      </header>

      <main className="wrap">
        <section aria-labelledby="pulse">
          <div className="section-head">
            <h2 id="pulse">Six years in one line</h2>
            <RailPicker data={data} value={rail} onChange={setRail} label="Show" />
          </div>
          <p className="lede">The record day for UPI so far was {weekday(stats.best.date)}, {fmtDate(stats.best.date)}, with {count(stats.best.v)} payments.</p>
          <Timeline data={data} rail={rail} marks={marks} onPick={pick} />
        </section>

        <section id="rhythms" aria-labelledby="h-rhythms">
          <h2 id="h-rhythms"><span className="chapnum">1</span> Everyday rhythms</h2>
          <Rhythms data={data} year={rhythmYear} />
        </section>

        <section id="festivals" aria-labelledby="h-festivals">
          <h2 id="h-festivals"><span className="chapnum">2</span> Festivals</h2>
          <p className="lede">Each card shows the most recent year, compared with a typical day for that date. Bars that are solid moved well beyond normal; faint bars are within the usual wobble.</p>
          <div className="cards">{FESTIVALS.map((f) => <EventCard key={f.title} data={data} f={f} onPick={pick} />)}</div>
        </section>

        <section id="moments" aria-labelledby="h-moments">
          <h2 id="h-moments"><span className="chapnum">3</span> National moments</h2>
          <p className="lede">Cricket, Budgets, elections and national holidays. Some stop the country; some barely register.</p>
          <div className="cards">{MOMENTS.map((f) => <EventCard key={f.title} data={data} f={f} onPick={pick} />)}</div>
        </section>

        <section id="year" aria-labelledby="h-year">
          <div className="section-head">
            <h2 id="h-year"><span className="chapnum">4</span> A year in colour</h2>
            <div className="controls">
              <RailPicker data={data} value={heatRail} onChange={setHeatRail} label="Show" />
              <label className="picker">
                <span>Year</span>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
            </div>
          </div>
          <p className="lede">Every day of the year, coloured by how far it was from a typical day. Tap a square to open that day.</p>
          <Heatmap data={data} rail={heatRail} year={year} selected={day} onPick={pick} />
        </section>

        <section id="explore" aria-labelledby="h-explore">
          <h2 id="h-explore"><span className="chapnum">5</span> Explore any day</h2>
          <p className="lede">Pick a birthday, a wedding, a day you remember. See how India paid.</p>
          <DayExplorer data={data} date={day} setDate={setDay} />
        </section>

        <section aria-labelledby="h-unexplained">
          <h2 id="h-unexplained">Days we can't explain (yet)</h2>
          <p className="lede">The strongest days for UPI, ATM cash or FASTag that don't line up with anything in our calendar. Some are outages, some are reporting quirks, some are mysteries. Know what happened? We'd like to hear.</p>
          <Unexplained data={data} onPick={pick} />
        </section>

        <section aria-labelledby="h-method">
          <h2 id="h-method">How this works</h2>
          <Method data={data} />
        </section>
      </main>
      <footer className="site-footer"><div className="wrap">Built from public data. Not affiliated with RBI or NPCI.</div></footer>
    </>
  );
}
