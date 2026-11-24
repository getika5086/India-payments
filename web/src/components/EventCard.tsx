import type { CalEvent, Data } from "../data";
import type { Featured } from "../featured";
import { fmtDate, pct, slug, weekday } from "../format";
import { describeDay } from "../describe";
import { CARD_RAILS } from "../rails";
import DiffBars from "./DiffBars";

type Props = { data: Data; f: Featured; onPick: (date: string) => void };

/** Pick the occurrence to show: pinned date, else latest confirmed, else latest. */
export function occurrences(data: Data, f: Featured) {
  const all = data.events.filter((e) => e.event === f.match).sort((a, b) => a.date.localeCompare(b.date));
  const main = f.date ? all.find((e) => e.date === f.date) : [...all].reverse().find((e) => e.confidence === "confirmed") ?? all.at(-1);
  return { all, main };
}

const sourceUrl = (s: string) => s.match(/https?:\/\/\S+/)?.[0] ?? null;

export default function EventCard({ data, f, onPick }: Props) {
  const { all, main } = occurrences(data, f);
  if (!main) return null;
  const sentence = describeDay(data, main.rails, CARD_RAILS);
  // headline rail for the year-by-year row: the biggest notable mover on the main day
  const head = CARD_RAILS.filter((r) => main.rails[r]?.z !== null && main.rails[r]?.z !== undefined)
    .sort((a, b) => Math.abs(main.rails[b].z!) - Math.abs(main.rails[a].z!))[0];
  const headName = data.rails.find((r) => r.id === head)?.short;
  const others = f.date ? [] : all.filter((e: CalEvent) => e.rails[head]);
  const id = slug(f.title);
  return (
    <article className="card" id={id}>
      <header>
        <h4><a href={`#${id}`} className="anchor">{f.title}</a></h4>
        <p className="card-date">
          {weekday(main.date)}, {fmtDate(main.date)}
          {main.confidence !== "confirmed" && <span className="flag" title="This date has not yet been checked against a second source"> · date to verify</span>}
        </p>
      </header>
      <p className="card-blurb">{f.blurb}</p>
      <p className="card-finding">{sentence}</p>
      <DiffBars data={data} values={main.rails} rails={CARD_RAILS} />
      {others.length > 1 && head && (
        <div className="years">
          <span className="years-label">{headName}, every year</span>
          <ul>
            {others.map((e) => (
              <li key={e.date}>
                <button onClick={() => onPick(e.date)} className={e.date === main.date ? "current" : ""} title={fmtDate(e.date)}>
                  <span>{e.date.slice(0, 4)}{e.confidence !== "confirmed" ? "*" : ""}</span>
                  <strong className={(e.rails[head].diff ?? 0) >= 0 ? "up" : "down"}>{pct(e.rails[head].diff)}</strong>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <footer>
        <button className="link" onClick={() => onPick(main.date)}>See every payment type that day</button>
        {sourceUrl(main.source) ? (
          <a href={sourceUrl(main.source)!} target="_blank" rel="noreferrer" className="source">Date source</a>
        ) : (
          <span className="source">Calendar date</span>
        )}
      </footer>
    </article>
  );
}
