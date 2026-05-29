import type { ReactNode } from "react";
import { Panel } from "./Panel";

export interface MessageThreadItem {
  id: string | number;
  name: string;
  type?: string;
  detail?: ReactNode;
}

export function MessageThread(props: { "aria-label": string; emptyLabel: string; items: MessageThreadItem[] }) {
  return (
    <Panel aria-label={props["aria-label"]}>
      {props.items.length === 0 ? (
        <p role="status">{props.emptyLabel}</p>
      ) : (
        <ol className="sx-message-thread">
          {props.items.map((item) => (
            <li key={item.id}>
              <span>{item.name}</span>
              {item.type ? <small>{item.type}</small> : null}
              {item.detail}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
