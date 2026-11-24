import type { Data } from "../data";
import { fmtDate } from "../format";

export default function Method({ data }: { data: Data }) {
  return (
    <div className="method">
      <p>
        Every number here is a count of transactions per day, published by the Reserve Bank of India for each payment system.
        We don't look at money values or individuals, only how many payments India made.
      </p>
      <p>
        For each payment type we work out what a <strong>typical day</strong> would have looked like: the slow growth of recent weeks,
        adjusted for the day of the week (that year's pattern) and the day of the month. Festival and event days are left out when
        working out "typical", so they don't water down their own effect. A day's figure is then compared with its typical day,
        as a percentage. A move is called out only when it is well beyond that payment type's normal day-to-day wobble
        (about 2.5 times its usual spread).
      </p>
      <p>
        Limits: the data covers all of India, so regional festivals can be too small to see. Bank holidays close cheque clearing and
        slow NEFT, so those rails react to the calendar as much as to people. From August 2025, FASTag trips on the new annual pass are
        reported separately and are not counted here.
      </p>
      <h4>Sources</h4>
      <ul>
        {data.meta.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.name}</a></li>)}
      </ul>
      <h4>Download the data</h4>
      <ul>
        <li><a href="/downloads/daily.csv" download>Daily volumes and values, every payment type (CSV)</a></li>
        <li><a href="/downloads/events.csv" download>Event calendar with sources (CSV)</a></li>
      </ul>
      <p className="muted">Data from {fmtDate(data.meta.first)} to {fmtDate(data.meta.last)}. Page built {fmtDate(data.meta.built)}.</p>
    </div>
  );
}
