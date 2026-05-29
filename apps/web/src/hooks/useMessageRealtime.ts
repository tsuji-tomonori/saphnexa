import { useEffect, useMemo, useState } from "react";
import { createAppSyncEventsClient } from "../lib/realtimeClient";

export type RealtimeStatus = "disabled" | "connecting" | "connected" | "closed" | "error";

export function useMessageRealtime(input: {
  messageId: string | null;
  ticket: string | null;
  channels: string[];
  onNotification?: () => void;
}) {
  const [status, setStatus] = useState<RealtimeStatus>("disabled");
  const client = useMemo(() => createAppSyncEventsClient(), []);

  useEffect(() => {
    if (!input.messageId || !input.ticket || input.channels.length === 0) {
      setStatus("disabled");
      return undefined;
    }
    setStatus("connecting");
    const disconnect = client.connect({
      ticket: input.ticket,
      channels: input.channels,
      onOpen() {
        setStatus("connected");
      },
      onMessage() {
        input.onNotification?.();
      },
      onError() {
        setStatus("error");
      },
      onClose() {
        setStatus("closed");
      }
    });
    return disconnect;
  }, [client, input.channels, input.messageId, input.onNotification, input.ticket]);

  return { status };
}
