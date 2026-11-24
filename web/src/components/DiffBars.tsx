import type { Data } from "../data";
import { pct } from "../format";
import { NOTABLE_Z } from "../rails";

type Props = { data: Data; values: Record<string, { diff: number | null; z: number | null } | undefined>; rails: string[]; max?: number };

/** One horizontal bar per rail: how far that day was from a typical day. */
export default function DiffBars({ data, values, rails, max = 50 }: Props) {
  const name = (id: string) => data.rails.find((r) => r.id === id)?.short ?? id;
  return (
    <ul className="diffbars" aria-label="Difference from a typical day, by payment type">
      {rails.map((id) => {
        const v = values[id];
        const d = v?.diff ?? null;
        const notable = v?.z !== null && v?.z !== undefined && Math.abs(v.z) >= NOTABLE_Z;
        const w = d === null ? 0 : Math.min(Math.abs(d), max) / max * 50;
        return (
          <li key={id} className={notable ? "notable" : ""}>
            <span className="diffbars-name">{name(id)}</span>
            <span className="diffbars-track" aria-hidden="true">
              <span className="diffbars-zero" />
              {d !== null && (
                <span className={`diffbars-bar ${d >= 0 ? "up" : "down"}`} style={d >= 0 ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` }} />
              )}
            </span>
            <span className="diffbars-val">{d === null ? "no data" : pct(d)}{Math.abs(d ?? 0) > max ? "" : ""}</span>
          </li>
        );
      })}
    </ul>
  );
}
