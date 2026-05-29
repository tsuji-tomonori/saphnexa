export interface RealtimeMessage {
  event: string;
  payload: Record<string, unknown>;
}

export interface RealtimeClient {
  connect(input: RealtimeConnectInput): () => void;
}

export interface RealtimeConnectInput {
  ticket: string;
  channels: string[];
  onMessage: (message: RealtimeMessage) => void;
  onOpen?: () => void;
  onError?: () => void;
  onClose?: () => void;
}

export function createAppSyncEventsClient(endpoint = "/event/realtime"): RealtimeClient {
  return {
    connect(input) {
      if (!endpoint || input.channels.length === 0) return () => undefined;
      const socket = new WebSocket(websocketUrl(endpoint));
      socket.addEventListener("open", () => {
        input.onOpen?.();
        socket.send(JSON.stringify({ type: "subscribe", ticket: input.ticket, channels: input.channels }));
      });
      socket.addEventListener("message", (event) => {
        const payload = parseRealtimeMessage(event.data);
        if (payload) input.onMessage(payload);
      });
      socket.addEventListener("error", () => input.onError?.());
      socket.addEventListener("close", () => input.onClose?.());
      return () => socket.close();
    }
  };
}

function websocketUrl(endpoint: string) {
  if (endpoint.startsWith("/")) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}${endpoint}`;
  }
  return endpoint;
}

function parseRealtimeMessage(data: unknown): RealtimeMessage | null {
  try {
    const parsed = typeof data === "string" ? JSON.parse(data) : JSON.parse(String(data));
    if (typeof parsed?.event !== "string" || typeof parsed?.payload !== "object" || parsed.payload === null) {
      return null;
    }
    return parsed as RealtimeMessage;
  } catch {
    return null;
  }
}
