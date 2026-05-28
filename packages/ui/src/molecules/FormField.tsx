import type { ReactNode } from "react";

export function FormField(props: { label: string; htmlFor: string; children: ReactNode; help?: string }) {
  return (
    <div className="sx-form-field">
      <label htmlFor={props.htmlFor}>{props.label}</label>
      {props.children}
      {props.help ? <p className="sx-help">{props.help}</p> : null}
    </div>
  );
}
