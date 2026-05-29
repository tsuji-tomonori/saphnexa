import type { ReactNode } from "react";

export function FormField(props: { label: string; htmlFor: string; children: ReactNode; help?: string | undefined }) {
  return (
    <div className="sx-form-field">
      <label htmlFor={props.htmlFor}>{props.label}</label>
      {props.children}
      {props.help ? <p className="sx-help">{props.help}</p> : null}
    </div>
  );
}
