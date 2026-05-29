import type { ReactNode } from "react";
import { themeClass } from "../theme.css";

export function AppShell(props: { className: string; navigation?: ReactNode; children: ReactNode }) {
  return (
    <main className={`${themeClass} ${props.className}`}>
      {props.navigation}
      {props.children}
    </main>
  );
}
