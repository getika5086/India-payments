import { useEffect, useState } from "react";
import type { CalEvent, Data } from "../data";
import type { Featured } from "../featured";
import { slug } from "../format";
import { fill } from "../insights";
import EventCard, { occurrences } from "./EventCard";

type Props = { data: Data; list: Featured[]; label: string; onPick: (date: string) => void };

/** Dropdown + insight text + one card. Remembers the choice in the URL hash for sharing. */
export default function EventSection({ data, list, label, onPick }: Props) {
  const fromHash = () => list.find((f) => `#${slug(f.title)}` === location.hash);
  const [f, setF] = useState<Featured>(fromHash() ?? list[0]);
  const [shown, setShown] = useState<CalEvent | undefined>(() => occurrences(data, fromHash() ?? list[0]).main);

  useEffect(() => {
    const onHash = () => { const h = fromHash(); if (h) choose(h); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  });

  const choose = (next: Featured) => {
    setF(next);
    setShown(occurrences(data, next).main);
    history.replaceState(null, "", `#${slug(next.title)}`);
  };

  return (
    <div className="event-section">
      <label className="picker picker-big">
        <span>{label}</span>
        <select value={f.title} onChange={(e) => choose(list.find((x) => x.title === e.target.value)!)}>
          {list.map((x) => <option key={x.title} value={x.title}>{x.title}</option>)}
        </select>
      </label>
      {shown && (
        <div className="event-layout">
          <div className="event-text">
            <p className="event-blurb">{f.blurb}</p>
            <h4>What happens</h4>
            <p>{fill(f.notice, data, f, shown)}</p>
            <h4>Why</h4>
            <p>{f.why}</p>
            <p className="muted small">The text above uses a typical year (the middle value across every year in the data). The card shows one year; tap another year to compare.</p>
          </div>
          <EventCard data={data} f={f} shown={shown} onYear={setShown} onPick={onPick} />
        </div>
      )}
    </div>
  );
}
