import { useCallback, useState } from "react";
import { apiPostOperation, apiRoutes } from "@saphnexa/api-client";
import { AppShell } from "@saphnexa/ui";
import { AssistantRuntimeBoundary } from "../features/chat/AssistantRuntimeBoundary";
import { CitationDrawerPanel } from "../features/chat/CitationDrawerPanel";
import { ChatSessionNav } from "../features/chat/ChatSessionNav";
import { FeedbackPanel } from "../features/chat/FeedbackPanel";
import { FavoritePanel } from "../features/chat/FavoritePanel";
import { MessageComposer } from "../features/chat/MessageComposer";
import { MessageEventsPanel } from "../features/chat/MessageEventsPanel";
import { useChatSessions } from "../hooks/useChatSessions";
import { useAddFavorite, useDeleteFavorite, useFavorites } from "../hooks/useFavorites";
import { useCreateFeedback } from "../hooks/useCreateFeedback";
import { useMe } from "../hooks/useMe";
import { useMessageEvents } from "../hooks/useMessageEvents";
import { useMessageRealtime } from "../hooks/useMessageRealtime";
import { submitAssistantQuestion } from "../lib/assistantRuntime";

export function ChatPage() {
  const me = useMe();
  const chatSessions = useChatSessions();
  const favorites = useFavorites();
  const csrfToken = me.data?.csrf_token ?? "";
  const addFavorite = useAddFavorite(csrfToken);
  const deleteFavorite = useDeleteFavorite(csrfToken);
  const createFeedback = useCreateFeedback(csrfToken);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageId, setMessageId] = useState<string | null>(null);
  const [wsTicket, setWsTicket] = useState<string | null>(null);
  const [wsChannels, setWsChannels] = useState<string[]>([]);
  const chats = chatSessions.data?.chats ?? [];
  const activeChatId = selectedChatId ?? chats[0]?.chat_id ?? null;
  const events = useMessageEvents(activeChatId, messageId);
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
        <FavoritePanel
          activeChatId={activeChatId}
          csrfToken={csrfToken}
          favorites={favorites.data?.favorites ?? []}
          isLoading={favorites.isFetching}
          isMutating={addFavorite.isPending || deleteFavorite.isPending}
          onAdd={(chatId) => addFavorite.mutate({ chat_id: chatId })}
          onDelete={(favoriteId) => deleteFavorite.mutate({ favorite_id: favoriteId })}
        />
        <FeedbackPanel
          activeChatId={activeChatId}
          activeMessageId={messageId}
          csrfToken={csrfToken}
          isPending={createFeedback.isPending}
          submittedRating={createFeedback.data?.feedback.rating}
          onSubmit={(input) => createFeedback.mutate({ chat_id: input.chatId, message_id: input.messageId, rating: input.rating, comment: input.comment })}
        />
        <MessageEventsPanel events={events.data?.events ?? []} />
        <CitationDrawerPanel open={Boolean(activeChatId && csrfToken)} events={events.data?.events ?? []} />
      </AssistantRuntimeBoundary>
    </AppShell>
  );
}
