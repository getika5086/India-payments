import { useMemo } from "react";
import type { Data } from "../data";
import { fmtDate, monthName, pct, weekday } from "../format";
import { useWidth } from "../hooks";

type Props = { data: Data; rail: string; year: number; selected: string | null; onPick: (date: string) => void };

const LIMIT = 30; // colour saturates at ±30%

/** Colour for a difference: teal above typical, coral below, grey near zero. */
export function diffColor(d: number | null | undefined) {
  if (d === null || d === undefined) return "var(--empty)";
  const t = Math.min(Math.abs(d), LIMIT) / LIMIT;
  if (t < 0.08) return "var(--neutral-cell)";
  const a = (0.18 + 0.82 * t).toFixed(2);
  return d > 0 ? `rgb(var(--up-rgb) / ${a})` : `rgb(var(--down-rgb) / ${a})`;
}

/** A year as 12 rows (months) × 31 columns (days). */
export default function Heatmap({ data, rail, year, selected, onPick }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const label = 34;
  const cell = Math.max(7, Math.min(30, Math.floor((width - label - 28) / 31) - 3));
  const gap = cell >= 12 ? 3 : 2;

  const rows = useMemo(() => {
    const s = data.daily[rail];
    return Array.from({ length: 12 }, (_, m) => {
      const days = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
      return Array.from({ length: days }, (_, d) => {
        const iso = `${year}-${String(m + 1).padStart(2, "0")}-${String(d + 1).padStart(2, "0")}`;
        const i = data.index[rail].get(iso);
        return { iso, diff: i === undefined ? undefined : s.diff[i] };
      });
    });
  }, [data, rail, year]);

  return (
    <div className="heatmap" ref={ref}>
      <div className="heatmap-grid" role="grid" aria-label={`${year}: each day's difference from a typical day`}>
        {rows.map((days, m) => (
          <div className="heatmap-row" role="row" key={m} style={{ gap }}>
            <span className="heatmap-month" style={{ width: label }}>{monthName(m + 1)}</span>
            {days.map(({ iso, diff }) => {
              const ev = data.eventsByDate.get(iso);
              return (
                <button key={iso} role="gridcell" className={`heatmap-cell${iso === selected ? " selected" : ""}${ev ? " has-event" : ""}`}
                  style={{ width: cell, height: cell, background: diffColor(diff) }}
                  disabled={diff === undefined}
                  onClick={() => onPick(iso)}
                  title={`${weekday(iso)}, ${fmtDate(iso)}: ${diff === undefined ? "no data" : pct(diff)}${ev ? ` · ${ev.map((e) => e.event).join(", ")}` : ""}`}
                  aria-label={`${fmtDate(iso)}, ${diff === undefined ? "no data" : pct(diff)} versus a typical day${ev ? `, ${ev.map((e) => e.event).join(", ")}` : ""}`} />
              );
            })}
          </div>
        ))}
      </div>
      <div className="legend" aria-hidden="true">
        <span>Quieter than typical</span>
        {[-30, -20, -10, 0, 10, 20, 30].map((v) => <span key={v} className="legend-swatch" style={{ background: diffColor(v) }} />)}
        <span>Busier</span>
        <span className="legend-dot" /> <span>has a calendar event</span>
      </div>
    </div>
  );
}
