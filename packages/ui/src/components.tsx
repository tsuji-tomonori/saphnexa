export function Button(props: { children: React.ReactNode; type?: "button" | "submit"; onClick?: () => void; disabled?: boolean }) {
  return <button className="sx-button" type={props.type || "button"} onClick={props.onClick} disabled={props.disabled}>{props.children}</button>;
}

export function Panel(props: { children: React.ReactNode; "aria-label"?: string }) {
  return <section className="sx-panel" aria-label={props["aria-label"]}>{props.children}</section>;
}

export function StatusBadge(props: { status: string }) {
  return <span className="sx-status" data-status={props.status}>{props.status}</span>;
}
