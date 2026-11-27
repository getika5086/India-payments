import type { CalEvent, Data } from "./data";
import type { Featured } from "./featured";
import { pct } from "./format";

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  return n === 0 ? null : n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};

/** Median difference for a rail across every occurrence of an event. */
export function medianDiff(data: Data, match: string, rail: string) {
  const vals = data.events.filter((e) => e.event === match).map((e) => e.rails[rail]?.diff).filter((v): v is number => v !== null && v !== undefined);
  return median(vals);
}

/** Replace {m:rail} and {l:rail} tokens with real numbers. */
const VERB = /\b(fall|falls|fell|rise|rises|rose|jump|jumps|jumped|dip|dips|dipped)\s+$/;

export function fill(text: string, data: Data, f: Featured, shown: CalEvent) {
  return text.replace(/\{([ml]):([a-z_]+)\}/g, (_, kind: string, rail: string, offset: number) => {
    const v = pct(kind === "m" ? medianDiff(data, f.match, rail) : shown.rails[rail]?.diff ?? null);
    // "NEFT falls 44%" reads better than "NEFT falls −44%"
    return VERB.test(text.slice(Math.max(0, offset - 12), offset)) ? v.replace(/^[+−]/, "") : v;
  });
}
