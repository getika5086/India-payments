import type { Data } from "./data";
import { pct } from "./format";
import { NOTABLE_Z } from "./rails";

const PHRASE: Record<string, string> = {
  upi: "UPI payments",
  atm: "ATM cash withdrawals",
  netc: "FASTag tolls",
  debit_card: "debit card spending",
  credit_card: "credit card spending",
  imps: "instant bank transfers",
  neft: "NEFT transfers",
  bbps: "bill payments",
  nach_credit: "salary and benefit credits",
  nach_debit: "EMI and SIP auto-debits",
  micro_atm: "village cash withdrawals",
  cts: "cheques",
};

/** Plain-language summary of the biggest notable moves on a day. */
export function describeDay(data: Data, values: Record<string, { diff: number | null; z: number | null } | undefined>, rails: string[]) {
  const moves = rails
    .map((id) => ({ id, ...values[id] }))
    .filter((m) => m.diff !== null && m.diff !== undefined && m.z !== null && m.z !== undefined && Math.abs(m.z) >= NOTABLE_Z)
    .sort((a, b) => Math.abs(b.z!) - Math.abs(a.z!))
    .slice(0, 3);
  void data;
  if (moves.length === 0) return "An ordinary day for payments: nothing moved more than its usual day-to-day wobble.";
  const list = (xs: string[]) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
  const clause = (group: typeof moves, up: boolean) =>
    `${list(group.map((m, i) => `${PHRASE[m.id] ?? m.id}${i === 0 ? ` ${up ? "rose" : "fell"}` : ""} ${pct(m.diff!).replace(/^[+−]/, "")}`))} ${up ? "above" : "below"} a normal day`;
  const ups = moves.filter((m) => m.diff! >= 0);
  const downs = moves.filter((m) => m.diff! < 0);
  const first = moves[0].diff! >= 0 ? [ups, downs] : [downs, ups];
  const parts = first.filter((g) => g.length).map((g) => clause(g, g[0].diff! >= 0));
  const s = parts.join(", while ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}
