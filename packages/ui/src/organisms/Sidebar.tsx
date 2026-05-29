import type { ReactNode } from "react";

export function Sidebar(props: { "aria-label": string; children: ReactNode }) {
  return (
    <aside className="sx-sidebar" aria-label={props["aria-label"]}>
      {props.children}
    </aside>
  );
}
