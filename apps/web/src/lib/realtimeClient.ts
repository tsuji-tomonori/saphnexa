export interface RealtimeMessage {
  event: string;
  payload: Record<string, unknown>;
}

export interface RealtimeClient {
  connect(input: { chatId: string; messageId: string; ticket: string; onMessage: (message: RealtimeMessage) => void }): () => void;
}

export function createAppSyncEventsClient(endpoint: string | undefined): RealtimeClient {
  return {
    connect(input) {
      if (!endpoint) return () => undefined;
      const socket = new WebSocket(`${endpoint}?ticket=${encodeURIComponent(input.ticket)}&chat_id=${encodeURIComponent(input.chatId)}&message_id=${encodeURIComponent(input.messageId)}`);
      socket.addEventListener("message", (event) => {
        const payload = JSON.parse(String(event.data)) as RealtimeMessage;
        input.onMessage(payload);
      });
      return () => socket.close();
    }
  };
}
