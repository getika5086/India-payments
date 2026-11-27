import type { CalEvent, Data } from "../data";
import type { Featured } from "../featured";
import { fmtDate, pct, weekday } from "../format";
import { CARD_RAILS } from "../rails";
import DiffBars from "./DiffBars";

/** All occurrences of a featured event, and the one to show first. */
export function occurrences(data: Data, f: Featured) {
  const all = data.events.filter((e) => e.event === f.match).sort((a, b) => a.date.localeCompare(b.date));
  const main = f.date ? all.find((e) => e.date === f.date) : [...all].reverse().find((e) => e.confidence === "confirmed") ?? all.at(-1);
  return { all: f.date ? all.filter((e) => e.date === f.date) : all, main };
}

const sourceUrl = (s: string) => s.match(/https?:\/\/\S+/)?.[0] ?? null;

type Props = { data: Data; f: Featured; shown: CalEvent; onYear: (e: CalEvent) => void; onPick: (date: string) => void };

/** The numbers for one occurrence: a bar per payment type, plus every other year. */
export default function EventCard({ data, f, shown, onYear, onPick }: Props) {
  const { all } = occurrences(data, f);
  // headline rail for the year row: the biggest notable mover on the shown day
  const head = CARD_RAILS.filter((r) => shown.rails[r]?.z !== null && shown.rails[r]?.z !== undefined)
    .sort((a, b) => Math.abs(shown.rails[b].z!) - Math.abs(shown.rails[a].z!))[0];
  const headName = data.rails.find((r) => r.id === head)?.short;
  const url = sourceUrl(shown.source);
  return (
    <article className="card">
      <header>
        <h4>{f.title}</h4>
        <p className="card-date">
          {weekday(shown.date)}, {fmtDate(shown.date)}
          {shown.confidence !== "confirmed" && <span className="flag" title="This date has not yet been checked against a second source"> · date to verify</span>}
        </p>
      </header>
      <p className="card-caption">Compared with a typical {weekday(shown.date)} at that time</p>
      <DiffBars data={data} values={shown.rails} rails={CARD_RAILS} />
      {all.length > 1 && head && (
        <div className="years">
          <span className="years-label">{headName}, every year · tap a year</span>
          <ul>
            {all.filter((e) => e.rails[head]).map((e) => (
              <li key={e.date}>
                <button onClick={() => onYear(e)} className={e.date === shown.date ? "current" : ""} aria-pressed={e.date === shown.date} title={fmtDate(e.date)}>
                  <span>{e.date.slice(0, 4)}{e.confidence !== "confirmed" ? "*" : ""}</span>
                  <strong className={(e.rails[head].diff ?? 0) >= 0 ? "up" : "down"}>{pct(e.rails[head].diff)}</strong>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <footer>
        <button className="link" onClick={() => onPick(shown.date)}>See all 12 payment types that day</button>
        {url ? <a href={url} target="_blank" rel="noreferrer" className="source">Date source</a> : <span className="source">Calendar date</span>}
      </footer>
    </article>
  );
}
