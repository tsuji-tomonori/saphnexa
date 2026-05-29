import { useCallback, useState } from "react";
import { apiPostOperation, apiRoutes } from "@saphnexa/api-client";
import { AppShell } from "@saphnexa/ui";
import { AssistantRuntimeBoundary } from "../features/chat/AssistantRuntimeBoundary";
import { CitationDrawerPanel } from "../features/chat/CitationDrawerPanel";
import { ChatSessionNav } from "../features/chat/ChatSessionNav";
import { MessageComposer } from "../features/chat/MessageComposer";
import { MessageEventsPanel } from "../features/chat/MessageEventsPanel";
import { useChatSessions } from "../hooks/useChatSessions";
import { useMe } from "../hooks/useMe";
import { useMessageEvents } from "../hooks/useMessageEvents";
import { useMessageRealtime } from "../hooks/useMessageRealtime";
import { submitAssistantQuestion } from "../lib/assistantRuntime";

export function ChatPage() {
  const me = useMe();
  const chatSessions = useChatSessions();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageId, setMessageId] = useState<string | null>(null);
  const [wsTicket, setWsTicket] = useState<string | null>(null);
  const [wsChannels, setWsChannels] = useState<string[]>([]);
  const chats = chatSessions.data?.chats ?? [];
  const activeChatId = selectedChatId ?? chats[0]?.chat_id ?? null;
  const events = useMessageEvents(activeChatId, messageId);
  const csrfToken = me.data?.csrf_token ?? "";
  const refetchMessageEvents = useCallback(() => {
    void events.refetch();
  }, [events.refetch]);
  const realtime = useMessageRealtime({
    messageId,
    ticket: wsTicket,
    channels: wsChannels,
    onNotification: refetchMessageEvents
  });

  async function submit(question: string) {
    if (!activeChatId) return;
    const accepted = await submitAssistantQuestion({ chatId: activeChatId, question, csrfToken });
    setMessageId(accepted.message_id);
    const ticket = await apiPostOperation("issueWsTicket", apiRoutes.issueWsTicket(), { chat_id: activeChatId, message_id: accepted.message_id }, csrfToken);
    setWsTicket(ticket.ticket);
    setWsChannels(ticket.channels);
  }

  return (
    <AppShell
      className="sx-chat-shell"
      navigation={<ChatSessionNav chats={chats} selectedChatId={activeChatId} onSelect={setSelectedChatId} />}
    >
      <AssistantRuntimeBoundary csrfToken={csrfToken} chatId={activeChatId}>
        <MessageComposer csrfToken={csrfToken} onSubmit={submit} />
        <p role="status">リアルタイム接続: {realtime.status}</p>
        <MessageEventsPanel events={events.data?.events ?? []} />
        <CitationDrawerPanel open={Boolean(activeChatId && csrfToken)} events={events.data?.events ?? []} />
      </AssistantRuntimeBoundary>
    </AppShell>
  );
}
