import type { ReactNode } from "react";

export function Panel(props: { children: ReactNode; "aria-label"?: string }) {
  return <section className="sx-panel" aria-label={props["aria-label"]}>{props.children}</section>;
}
