export type Rail = { id: string; short: string; name: string; unit: string; first: string; last: string };
export type Series = { start: string; dates: string[]; actual: number[]; expected: number[]; diff: (number | null)[]; z: (number | null)[] };
export type Rhythm = { weekday_by_year: Record<string, (number | null)[]>; day_of_month: number[]; month_of_year: (number | null)[] };
export type RailDiff = { diff: number | null; z: number | null };
export type CalEvent = { date: string; event: string; chapter: string; type: string; source: string; confidence: string; rails: Record<string, RailDiff> };
export type Unexplained = { date: string; rail: string; diff: number; z: number };
export type Meta = { first: string; last: string; built: string; sources: { name: string; url: string }[] };

export type Data = {
  rails: Rail[];
  daily: Record<string, Series>;
  rhythms: Record<string, Rhythm>;
  events: CalEvent[];
  unexplained: Unexplained[];
  meta: Meta;
  /** rail -> date -> index into that rail's arrays */
  index: Record<string, Map<string, number>>;
  /** date -> events that day */
  eventsByDate: Map<string, CalEvent[]>;
};

const get = <T,>(name: string): Promise<T> =>
  fetch(`/data/${name}.json`).then((r) => {
    if (!r.ok) throw new Error(`Could not load ${name}`);
    return r.json() as Promise<T>;
  });

export async function loadData(): Promise<Data> {
  const [rails, daily, rhythms, events, unexplained, meta] = await Promise.all([
    get<Rail[]>("rails"),
    get<Record<string, Series>>("daily"),
    get<Record<string, Rhythm>>("rhythms"),
    get<CalEvent[]>("events"),
    get<Unexplained[]>("unexplained"),
    get<Meta>("meta"),
  ]);
  const index: Data["index"] = {};
  for (const [rid, s] of Object.entries(daily)) index[rid] = new Map(s.dates.map((d, i) => [d, i]));
  const eventsByDate = new Map<string, CalEvent[]>();
  for (const e of events) eventsByDate.set(e.date, [...(eventsByDate.get(e.date) ?? []), e]);
  return { rails, daily, rhythms, events, unexplained, meta, index, eventsByDate };
}

export function dayValue(data: Data, rail: string, date: string) {
  const i = data.index[rail]?.get(date);
  if (i === undefined) return null;
  const s = data.daily[rail];
  return { actual: s.actual[i], expected: s.expected[i], diff: s.diff[i], z: s.z[i] };
}
