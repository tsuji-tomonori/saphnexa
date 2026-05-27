export function createLightweightNotification(event) {
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

export function assertNotificationIsLightweight(notification) {
  const serialized = JSON.stringify(notification);
  const forbidden = ["answer_text", "citation_text", "retrieved_chunk_text", "content_text"];
  for (const key of forbidden) {
    if (serialized.includes(key)) throw new Error(`notification contains forbidden field ${key}`);
  }
  if (Buffer.byteLength(serialized, "utf8") > 4096) throw new Error("notification payload exceeds 4KB");
  return true;
}
