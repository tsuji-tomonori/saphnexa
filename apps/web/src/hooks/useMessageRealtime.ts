import { useEffect, useMemo, useState } from "react";
import { createAppSyncEventsClient } from "../lib/realtimeClient";

export function useMessageRealtime(chatId: string | null, messageId: string | null, ticket: string | null) {
  const [status, setStatus] = useState<"disabled" | "connected">("disabled");
  const client = useMemo(() => createAppSyncEventsClient(readViteEnv("VITE_APPSYNC_EVENTS_URL")), []);

  useEffect(() => {
    if (!chatId || !messageId || !ticket) {
      setStatus("disabled");
      return undefined;
    }
    const disconnect = client.connect({
      chatId,
      messageId,
      ticket,
      onMessage() {
        setStatus("connected");
      }
    });
    return disconnect;
  }, [chatId, client, messageId, ticket]);

  return { status };
}

function readViteEnv(name: string) {
  const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> };
  return meta.env?.[name];
}
