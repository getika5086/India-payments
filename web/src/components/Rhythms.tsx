import type { Data } from "../data";
import { dayNames, monthName, pct } from "../format";
import Notice from "./Notice";

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

const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
};
const times = (p: number) => `${(1 + p / 100).toFixed(1).replace(/\.0$/, "")} times`;

export default function Rhythms({ data, year }: { data: Data; year: number }) {
  const short = dayNames.map((d) => d.slice(0, 3));
  const dom = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const months = Array.from({ length: 12 }, (_, i) => monthName(i + 1).slice(0, 1));
  const monthsLong = Array.from({ length: 12 }, (_, i) => monthName(i + 1, true));
  const wk = (id: string) => data.rhythms[id].weekday_by_year[String(year)] ?? [];
  const dm = (id: string) => data.rhythms[id].day_of_month;
  const my = (id: string) => data.rhythms[id].month_of_year;
  const early = (id: string) => avg(dm(id).slice(0, 10));
  const late = (id: string) => avg(dm(id).slice(20, 31));
  const emi = extreme(dm("nach_debit"), dom).hi;
  const upiWk = wk("upi").filter((v): v is number => v !== null);
  const upiSpread = upiWk.length ? Math.max(...upiWk.map(Math.abs)) : 0;

  return (
    <>
      <h3>The week</h3>
      <p className="lede">How each day of the week compares with that week's average, in {year}.</p>
      <div className="multiples">
        {WEEK_RAILS.map((id) => {
          const v = wk(id);
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
      <Notice>
        <ul>
          <li><strong>UPI doesn't know it's the weekend.</strong> No day is more than {pct(upiSpread).replace("+", "")} away from average. It's how India pays for tea, groceries and auto rides, and daily life doesn't take Sundays off.</li>
          <li><strong>FASTag is busiest on Saturday and Sunday</strong> ({pct(wk("netc")[5])}, {pct(wk("netc")[6])}): weekend trips and visits to family.</li>
          <li><strong>The banking system does take Sundays off.</strong> NEFT falls {pct(wk("neft")[6]).replace(/^[+−]/, "")} and cheques don't clear at all; offices and businesses are shut.</li>
          <li><strong>Card payments jump on Monday</strong> (debit {pct(wk("debit_card")[0])}). Most likely the weekend's card payments are counted when they settle with banks on Monday, not when you tap.</li>
        </ul>
      </Notice>

      <h3>Salary week</h3>
      <p className="lede">Each day of the month compared with a typical day, across all years.</p>
      <div className="summary">
        <p>
          <strong>India's month has two halves.</strong> In the first ten days money arrives and leaves fast: salaries and pensions land,
          loan EMIs and SIPs are auto-debited, bills get paid and ATMs have their busiest days. By the last ten days, cash withdrawals,
          bill payments and UPI all slow down as wallets thin out, until the next payday starts the cycle again.
        </p>
        <ul className="summary-stats">
          <li><span>EMIs & SIPs</span><strong>{times(emi.v)}</strong><em>a typical day's volume on the {emi.l}th</em></li>
          <li><span>ATM cash</span><strong>{pct(early("atm"))} / {pct(late("atm"))}</strong><em>first ten days / last ten days</em></li>
          <li><span>Bills</span><strong>{pct(early("bbps"))} / {pct(late("bbps"))}</strong><em>first ten days / last ten days</em></li>
          <li><span>UPI</span><strong>{pct(early("upi"))} / {pct(late("upi"))}</strong><em>first ten days / last ten days</em></li>
        </ul>
      </div>
      <div className="multiples">
        {MONTH_RAILS.map((id) => {
          const v = dm(id);
          const { hi } = extreme(v, dom);
          return (
            <figure key={id} className="panel">
              <figcaption><strong>{name(data, id)}</strong><span>Peaks on day {hi.l} ({pct(hi.v)})</span></figcaption>
              <SmallBars values={v} labels={dom} highlight={(i) => i < 10} ariaLabel={`${name(data, id)} by day of month`} />
            </figure>
          );
        })}
      </div>
      <Notice>
        <ul>
          <li><strong>The 2nd, 3rd and 5th are India's due dates.</strong> Banks and fund houses cluster auto-debits on a handful of days just after salaries arrive, so EMI and SIP volumes multiply on those dates.</li>
          <li><strong>Credit cards barely follow payday.</strong> They are used through the month and paid off once, so the line stays flat.</li>
          <li>Salaries and benefits also spike mid-month and on the last day: government benefits and some employers pay on fixed dates other than the 1st.</li>
        </ul>
      </Notice>

      <h3>The seasons</h3>
      <p className="lede">Each month compared with the twelve months around it, typical across all years.</p>
      <div className="multiples">
        {SEASON_RAILS.map((id) => {
          const v = my(id);
          const { hi, lo } = extreme(v, monthsLong);
          return (
            <figure key={id} className="panel">
              <figcaption><strong>{name(data, id)}</strong><span>Strongest in {hi.l} ({pct(hi.v)}), weakest in {lo.l} ({pct(lo.v)})</span></figcaption>
              <SmallBars values={v} labels={months} ariaLabel={`${name(data, id)} by month`} />
            </figure>
          );
        })}
      </div>
      <Notice>
        <ul>
          <li><strong>October is the festive month.</strong> ATM cash ({pct(my("atm")[9])}), debit cards ({pct(my("debit_card")[9])}) and credit cards ({pct(my("credit_card")[9])}) all peak: Navratri, Dussehra, the big online sales and, often, Diwali shopping.</li>
          <li><strong>March is year-end.</strong> NEFT jumps {pct(my("neft")[2]).replace(/^[+−]/, "")} as businesses settle accounts before the financial year closes on 31 March.</li>
          <li><strong>FASTag follows the travel calendar.</strong> High from February to June (weddings, pilgrimages, summer holidays), low through the monsoon from July to October.</li>
        </ul>
      </Notice>
    </>
  );
}
