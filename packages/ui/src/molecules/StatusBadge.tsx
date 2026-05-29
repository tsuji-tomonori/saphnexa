import { statusBadgeRecipe } from "../theme.css";

export function StatusBadge(props: { status: string }) {
  return <span className={statusBadgeRecipe({ tone: statusTone(props.status) })} data-status={props.status} aria-label={`状態: ${props.status}`}>{props.status}</span>;
}

function statusTone(status: string): "neutral" | "warning" | "danger" {
  if (/fail|error|denied|失敗|エラー/.test(status)) return "danger";
  if (/pending|queued|warning|保留|警告/.test(status)) return "warning";
  return "neutral";
}
