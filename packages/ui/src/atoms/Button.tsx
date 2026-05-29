import type { ReactNode } from "react";
import { buttonRecipe } from "../theme.css";

export function Button(props: { children: ReactNode; type?: "button" | "submit"; onClick?: () => void; disabled?: boolean; tone?: "primary" | "secondary" }) {
  return <button className={buttonRecipe({ tone: props.tone })} type={props.type || "button"} onClick={props.onClick} disabled={props.disabled}>{props.children}</button>;
}
