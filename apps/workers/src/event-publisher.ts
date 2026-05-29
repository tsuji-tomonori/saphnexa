export const forbiddenNotificationFields = [
  "answer_text",
  "citation_text",
  "retrieved_chunk_text",
  "content_text"
] as const;

export const maxNotificationPayloadBytes = 4096;

export interface ChatMessageEventForNotification {
  event_id: string;
  event_seq: number;
  event_name: string;
  event_type: string;
  chat_id: string;
  message_id: string;
}

export interface LightweightNotification {
  event_id: string;
  event_seq: number;
  event_name: string;
  event_type: string;
  chat_id: string;
  message_id: string;
  detail_url: string;
}

export function createLightweightNotification(event: ChatMessageEventForNotification): LightweightNotification {
  return {
    event_id: event.event_id,
    event_seq: event.event_seq,
    event_name: event.event_name,
    event_type: event.event_type,
    chat_id: event.chat_id,
    message_id: event.message_id,
    detail_url: `/api/chat-sessions/${event.chat_id}/messages/${event.message_id}/events?after_seq=${event.event_seq - 1}`
  };
}

export function assertNotificationIsLightweight(notification: LightweightNotification | Record<string, unknown>): boolean {
  const serialized = JSON.stringify(notification);
  for (const key of forbiddenNotificationFields) {
    if (serialized.includes(key)) throw new Error(`notification contains forbidden field ${key}`);
  }
  if (Buffer.byteLength(serialized, "utf8") > maxNotificationPayloadBytes) throw new Error("notification payload exceeds 4KB");
  return true;
}
