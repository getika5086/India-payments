import { useMemo, useState } from "react";
import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import type { Data } from "../data";
import { count, fmtDate, pct, weekday } from "../format";
import { useWidth } from "../hooks";

type Props = { data: Data; rail: string; marks: { date: string; label: string }[]; onPick: (date: string) => void };

const H = 300;
const M = { t: 16, r: 12, b: 28, l: 52 };

/** Daily volume for one rail across the whole period, with featured days marked. */
export default function Timeline({ data, rail, marks, onPick }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const s = data.daily[rail];
  const n = s.dates.length;

  const { x, y, path, expPath, years } = useMemo(() => {
    const x = scaleLinear().domain([0, n - 1]).range([M.l, width - M.r]);
    const ymax = Math.max(...s.actual) * 1.05;
    const y = scaleLinear().domain([0, ymax]).nice().range([H - M.b, M.t]);
    const path = line<number>().x((_, i) => x(i)).y((v) => y(v))(s.actual) ?? "";
    const expPath = line<number>().x((_, i) => x(i)).y((v) => y(v))(s.expected) ?? "";
    const years = s.dates.map((d, i) => ({ d, i })).filter(({ d }) => d.endsWith("-01-01"));
    return { x, y, path, expPath, years };
  }, [s, n, width]);

  const idx = (date: string) => data.index[rail].get(date);
  const unit = Math.max(...s.actual) >= 100 ? 100 : 1;
  const yTicks = y.ticks(4);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.round(x.invert(e.clientX - box.left + M.l));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const h = hover !== null ? { date: s.dates[hover], actual: s.actual[hover], diff: s.diff[hover], ev: data.eventsByDate.get(s.dates[hover]) } : null;

  return (
    <div className="timeline" ref={ref}>
      <svg width={width} height={H} role="img" aria-label={`Daily ${data.rails.find((r) => r.id === rail)?.name} from ${fmtDate(s.dates[0])} to ${fmtDate(s.dates[n - 1])}`}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={width - M.r} y1={y(t)} y2={y(t)} className="grid" />
            <text x={M.l - 8} y={y(t) + 4} textAnchor="end" className="tick">
              {unit === 100 ? `${(t / 100).toLocaleString("en-IN")} cr` : `${t} L`}
            </text>
          </g>
        ))}
        {years.map(({ d, i }) => (
          <g key={d}>
            <line x1={x(i)} x2={x(i)} y1={M.t} y2={H - M.b} className="grid" />
            <text x={x(i) + 4} y={H - M.b + 18} className="tick">{d.slice(0, 4)}</text>
          </g>
        ))}
        <path d={expPath} className="line-expected" />
        <path d={path} className="line-actual" />
        {marks.map((m) => {
          const i = idx(m.date);
          if (i === undefined) return null;
          return (
            <circle key={m.date + m.label} cx={x(i)} cy={y(s.actual[i])} r={4} className="mark" onClick={() => onPick(m.date)}>
              <title>{`${m.label}, ${fmtDate(m.date)}`}</title>
            </circle>
          );
        })}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={M.t} y2={H - M.b} className="crosshair" />}
        <rect x={M.l} y={M.t} width={Math.max(0, width - M.l - M.r)} height={H - M.t - M.b} fill="transparent"
          onPointerMove={onMove} onPointerLeave={() => setHover(null)} onClick={() => hover !== null && onPick(s.dates[hover])} />
      </svg>
      <div className="readout" aria-live="polite">
        {h ? (
          <>
            <strong>{weekday(h.date)}, {fmtDate(h.date)}</strong>
            <span>{count(h.actual)} transactions</span>
            <span className={h.diff !== null && h.diff >= 0 ? "up" : "down"}>{pct(h.diff)} vs a typical day</span>
            {h.ev && <span className="readout-ev">{h.ev.map((e) => e.event).join(" · ")}</span>}
          </>
        ) : (
          <span className="muted">Hover or tap the chart to read any day. Dots mark the days featured below; the faint line is a typical day.</span>
        )}
      </div>
    </div>
  );
}
