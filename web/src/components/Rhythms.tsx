import type { Data } from "../data";
import { dayNames, monthName, pct } from "../format";

type BarsProps = { values: (number | null)[]; labels: string[]; highlight?: (i: number) => boolean; height?: number; ariaLabel: string };

/** Small column chart of signed % values around a zero line. */
function SmallBars({ values, labels, highlight, height = 120, ariaLabel }: BarsProps) {
  const W = 300;
  const pad = { t: 14, b: 18 };
  const max = Math.max(5, ...values.map((v) => Math.abs(v ?? 0)));
  const mid = pad.t + (height - pad.t - pad.b) / 2;
  const scale = (height - pad.t - pad.b) / 2 / max;
  const bw = W / values.length;
  const every = values.length > 12 ? 5 : 1;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="smallbars" role="img" aria-label={ariaLabel}>
      <line x1={0} x2={W} y1={mid} y2={mid} className="zero" />
      {values.map((v, i) => {
        if (v === null) return null;
        const h = Math.abs(v) * scale;
        return (
          <g key={i}>
            <rect x={i * bw + bw * 0.15} width={bw * 0.7} y={v >= 0 ? mid - h : mid} height={Math.max(h, 0.5)}
              className={`${v >= 0 ? "up" : "down"}${highlight?.(i) ? " hl" : ""}`}>
              <title>{`${labels[i]}: ${pct(v, 1)}`}</title>
            </rect>
          </g>
        );
      })}
      {labels.map((l, i) => (i % every === 0 || i === labels.length - 1) && (
        <text key={l + i} x={i * bw + bw / 2} y={height - 4} textAnchor="middle" className="tick">{l}</text>
      ))}
      <text x={2} y={10} className="tick">{pct(max)}</text>
    </svg>
  );
}

const extreme = (vals: (number | null)[], labels: string[]) => {
  const ok = vals.map((v, i) => ({ v, l: labels[i] })).filter((x): x is { v: number; l: string } => x.v !== null);
  const hi = ok.reduce((a, b) => (b.v > a.v ? b : a));
  const lo = ok.reduce((a, b) => (b.v < a.v ? b : a));
  return { hi, lo };
};

const name = (data: Data, id: string) => data.rails.find((r) => r.id === id)?.short ?? id;

const WEEK_RAILS = ["upi", "atm", "netc", "debit_card", "neft", "cts"];
const MONTH_RAILS = ["nach_credit", "nach_debit", "atm", "bbps", "upi", "credit_card"];
const SEASON_RAILS = ["upi", "atm", "netc", "debit_card", "credit_card", "neft"];

export default function Rhythms({ data, year }: { data: Data; year: number }) {
  const short = dayNames.map((d) => d.slice(0, 3));
  const dom = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const months = Array.from({ length: 12 }, (_, i) => monthName(i + 1).slice(0, 1));
  const monthsLong = Array.from({ length: 12 }, (_, i) => monthName(i + 1, true));

  return (
    <>
      <h3>The week</h3>
      <p className="lede">How each day of the week compares with that week's average, in {year}. Phone payments barely notice the weekend; the banking system does.</p>
      <div className="multiples">
        {WEEK_RAILS.map((id) => {
          const v = data.rhythms[id].weekday_by_year[String(year)] ?? [];
          if (!v.length) return null;
          const { hi, lo } = extreme(v, dayNames);
          return (
            <figure key={id} className="panel">
              <figcaption><strong>{name(data, id)}</strong><span>Busiest {hi.l} ({pct(hi.v)}), quietest {lo.l} ({pct(lo.v)})</span></figcaption>
              <SmallBars values={v} labels={short} highlight={(i) => i >= 5} ariaLabel={`${name(data, id)} by weekday`} />
            </figure>
          );
        })}
      </div>

      <h3>Salary week</h3>
      <p className="lede">Each day of the month compared with a typical day, across all years. The first days of the month are when salaries land and EMIs, SIPs and bills go out.</p>
      <div className="multiples">
        {MONTH_RAILS.map((id) => {
          const v = data.rhythms[id].day_of_month;
          const { hi } = extreme(v, dom);
          return (
            <figure key={id} className="panel">
              <figcaption><strong>{name(data, id)}</strong><span>Peaks on day {hi.l} ({pct(hi.v)})</span></figcaption>
              <SmallBars values={v} labels={dom} highlight={(i) => i < 5} ariaLabel={`${name(data, id)} by day of month`} />
            </figure>
          );
        })}
      </div>

      <h3>The seasons</h3>
      <p className="lede">Each month compared with the twelve months around it, typical across all years. Festive October and November, the year-end rush in March, the summer road trip.</p>
      <div className="multiples">
        {SEASON_RAILS.map((id) => {
          const v = data.rhythms[id].month_of_year;
          const { hi, lo } = extreme(v, monthsLong);
          return (
            <figure key={id} className="panel">
              <figcaption><strong>{name(data, id)}</strong><span>Strongest in {hi.l} ({pct(hi.v)}), weakest in {lo.l} ({pct(lo.v)})</span></figcaption>
              <SmallBars values={v} labels={months} ariaLabel={`${name(data, id)} by month`} />
            </figure>
          );
        })}
      </div>
    </>
  );
}
