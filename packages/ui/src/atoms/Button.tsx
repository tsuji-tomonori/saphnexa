import type { ReactNode } from "react";

export function Button(props: { children: ReactNode; type?: "button" | "submit"; onClick?: () => void; disabled?: boolean }) {
  return <button className="sx-button" type={props.type || "button"} onClick={props.onClick} disabled={props.disabled}>{props.children}</button>;
}
