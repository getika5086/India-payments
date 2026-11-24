const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** "2024-10-29" -> "29 Oct 2024" (string-based, so no timezone shifts) */
export const fmtDate = (iso: string, long = false) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${(long ? LONG_MONTHS : MONTHS)[m - 1]} ${y}`;
};
export const weekday = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return DAYS[(new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7];
};
export const monthName = (m: number, long = false) => (long ? LONG_MONTHS : MONTHS)[m - 1];
export const dayNames = DAYS;

/** +12% / −8% with a real minus sign */
export const pct = (v: number | null | undefined, digits = 0) => {
  if (v === null || v === undefined || !Number.isFinite(v)) return "–";
  const s = Math.abs(v).toFixed(digits);
  if (Number(s) === 0) return "0%";
  return `${v > 0 ? "+" : "−"}${s}%`;
};

/** lakh -> readable count: 7,412 lakh -> "74.1 crore" */
export const count = (lakh: number) => {
  if (lakh >= 100) return `${(lakh / 100).toLocaleString("en-IN", { maximumFractionDigits: lakh >= 1000 ? 0 : 1 })} crore`;
  return `${lakh.toLocaleString("en-IN", { maximumFractionDigits: 1 })} lakh`;
};

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
