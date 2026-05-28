import type { ReactNode } from "react";

export function Drawer(props: { open: boolean; title: string; children: ReactNode }) {
  return (
    <aside className="sx-drawer" aria-label={props.title} aria-hidden={props.open ? "false" : "true"}>
      {props.open ? props.children : null}
    </aside>
  );
}
