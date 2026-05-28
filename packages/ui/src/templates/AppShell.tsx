import type { ReactNode } from "react";

export function AppShell(props: { className: string; navigation?: ReactNode; children: ReactNode }) {
  return (
    <main className={props.className}>
      {props.navigation}
      {props.children}
    </main>
  );
}
