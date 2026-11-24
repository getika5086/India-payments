import type { Data } from "../data";
import { fmtDate, pct, weekday } from "../format";

export default function Unexplained({ data, onPick }: { data: Data; onPick: (d: string) => void }) {
  const name = (id: string) => data.rails.find((r) => r.id === id)?.short ?? id;
  const rows = data.unexplained.slice(0, 18);
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Day</th><th>Payment type</th><th className="num">vs typical</th></tr></thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.date + u.rail}>
              <td><button className="link" onClick={() => onPick(u.date)}>{weekday(u.date).slice(0, 3)}, {fmtDate(u.date)}</button></td>
              <td>{name(u.rail)}</td>
              <td className={`num ${u.diff >= 0 ? "up" : "down"}`}>{pct(u.diff)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
