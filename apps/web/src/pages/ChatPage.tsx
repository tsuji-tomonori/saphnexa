import { useMemo, useState } from "react";
import { apiPost } from "../../../../packages/api-client/src/client";
import { AppShell, Drawer } from "../../../../packages/ui/src/components";
import { ChatSessionNav } from "../features/chat/ChatSessionNav";
import { MessageComposer } from "../features/chat/MessageComposer";
import { MessageEventsPanel } from "../features/chat/MessageEventsPanel";
import { useChatSessions } from "../hooks/useChatSessions";
import { useMe } from "../hooks/useMe";
import { useMessageEvents } from "../hooks/useMessageEvents";
import { createSaphnexaAssistantAdapter } from "../lib/assistantRuntime";

export function ChatPage() {
  const me = useMe();
  const chatSessions = useChatSessions();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageId, setMessageId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const chats = chatSessions.data?.chats ?? [];
  const activeChatId = selectedChatId ?? chats[0]?.chat_id ?? null;
  const events = useMessageEvents(activeChatId, messageId);
  const csrfToken = me.data?.csrf_token ?? "";
  const assistantAdapter = useMemo(() => (activeChatId ? createSaphnexaAssistantAdapter(csrfToken, activeChatId) : null), [activeChatId, csrfToken]);

  async function submit() {
    if (!activeChatId) return;
    const accepted = await apiPost<{ message_id: string }>("/api/chat-sessions/" + activeChatId + "/messages", { question }, csrfToken);
    setMessageId(accepted.message_id);
  }

  return (
    <AppShell
      className="sx-chat-shell"
      navigation={<ChatSessionNav chats={chats} selectedChatId={activeChatId} onSelect={setSelectedChatId} />}
    >
      <MessageComposer question={question} csrfToken={csrfToken} onQuestionChange={setQuestion} onSubmit={submit} />
      <MessageEventsPanel events={events.data?.events ?? []} />
      <Drawer open={Boolean(assistantAdapter)} title="引用">
        <p role="status">引用は回答生成後に表示されます</p>
      </Drawer>
    </AppShell>
  );
}
