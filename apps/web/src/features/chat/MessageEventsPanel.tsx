import { MessageThread } from "@saphnexa/ui";
import type { EventRow } from "../../types";

export function MessageEventsPanel(props: { events: EventRow[] }) {
  return (
    <MessageThread
      aria-label="イベント"
      emptyLabel="イベントはありません"
      items={props.events.map((event) => ({
        id: event.event_seq,
        name: event.event_name,
        type: event.event_type
      }))}
    />
  );
}
