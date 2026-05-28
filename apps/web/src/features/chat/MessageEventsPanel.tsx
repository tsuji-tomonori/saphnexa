import { Panel } from "../../../../../packages/ui/src/components";
import type { EventRow } from "../../types";

export function MessageEventsPanel(props: { events: EventRow[] }) {
  return (
    <Panel aria-label="イベント">
      {props.events.length === 0 ? (
        <p role="status">イベントはありません</p>
      ) : (
        props.events.map((event) => <div key={event.event_seq}>{event.event_name}</div>)
      )}
    </Panel>
  );
}
