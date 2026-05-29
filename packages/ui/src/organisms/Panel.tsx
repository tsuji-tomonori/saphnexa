import type { ReactNode } from "react";
import { panelRecipe } from "../theme.css";

export function Panel(props: { children: ReactNode; "aria-label"?: string }) {
  return <section className={panelRecipe()} aria-label={props["aria-label"]}>{props.children}</section>;
}
