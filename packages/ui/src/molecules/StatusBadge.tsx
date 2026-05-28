export function StatusBadge(props: { status: string }) {
  return <span className="sx-status" data-status={props.status} aria-label={`状態: ${props.status}`}>{props.status}</span>;
}
