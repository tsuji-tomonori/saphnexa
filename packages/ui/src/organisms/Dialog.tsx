import type { ReactNode } from "react";

export function Dialog(props: { open: boolean; title: string; children: ReactNode }) {
  if (!props.open) return null;
  return (
    <div className="sx-dialog" role="dialog" aria-modal="true" aria-label={props.title}>
      {props.children}
    </div>
  );
}
