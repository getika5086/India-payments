import type { ReactNode } from "react";

/** A short "what to notice" box placed under a chart. */
export default function Notice({ title = "What to notice", children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="notice">
      <p className="notice-title">{title}</p>
      {children}
    </aside>
  );
}
