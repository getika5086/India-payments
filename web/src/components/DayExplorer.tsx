import type { Data } from "../data";
import { dayValue } from "../data";
import { count, fmtDate, weekday } from "../format";
import { describeDay } from "../describe";
import { PICKER_RAILS } from "../rails";
import DiffBars from "./DiffBars";

type Props = { data: Data; date: string; setDate: (d: string) => void };

const shift = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

export default function DayExplorer({ data, date, setDate }: Props) {
  const { first, last } = data.meta;
  const values = Object.fromEntries(PICKER_RAILS.map((r) => [r, dayValue(data, r, date) ?? undefined]));
  const events = data.eventsByDate.get(date) ?? [];
  const upi = dayValue(data, "upi", date);
  return (
    <div className="explorer">
      <div className="explorer-controls">
        <button onClick={() => setDate(shift(date, -1))} disabled={date <= first} aria-label="Previous day">‹</button>
        <label>
          <span className="sr-only">Pick a date</span>
          <input type="date" value={date} min={first} max={last} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
        <button onClick={() => setDate(shift(date, 1))} disabled={date >= last} aria-label="Next day">›</button>
      </div>
      <div className="explorer-body">
        <div>
          <h4>{weekday(date)}, {fmtDate(date, true)}</h4>
          {events.length > 0 && (
            <ul className="chips">{events.map((e) => <li key={e.event}>{e.event}</li>)}</ul>
          )}
          <p className="card-finding">{describeDay(data, values, PICKER_RAILS)}</p>
          {upi && <p className="muted">India made {count(upi.actual)} UPI payments that day; a typical {weekday(date)} at that time would have seen about {count(upi.expected)}.</p>}
        </div>
        <DiffBars data={data} values={values} rails={PICKER_RAILS} />
      </div>
    </div>
  );
}
