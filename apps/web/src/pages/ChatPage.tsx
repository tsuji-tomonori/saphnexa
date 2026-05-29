import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiPostOperation, apiRoutes } from "@saphnexa/api-client";
import { AppShell } from "@saphnexa/ui";
import { AssistantRuntimeBoundary } from "../features/chat/AssistantRuntimeBoundary";
import { ChatParticipantsPanel } from "../features/chat/ChatParticipantsPanel";
import { CitationDrawerPanel } from "../features/chat/CitationDrawerPanel";
import { ChatSessionNav } from "../features/chat/ChatSessionNav";
import { FeedbackPanel } from "../features/chat/FeedbackPanel";
import { FavoritePanel } from "../features/chat/FavoritePanel";
import { MessageComposer } from "../features/chat/MessageComposer";
import { MessageEventsPanel } from "../features/chat/MessageEventsPanel";
import { MessageHistoryPanel } from "../features/chat/MessageHistoryPanel";
import { useChatSessions, useCreateChatSession, useDeleteChatSession, useUpdateChatSession } from "../hooks/useChatSessions";
import { useAddFavorite, useDeleteFavorite, useFavorites } from "../hooks/useFavorites";
import { useCreateFeedback } from "../hooks/useCreateFeedback";
import { useMe } from "../hooks/useMe";
import { useCancelAnswerGeneration, useChatMessages } from "../hooks/useChatMessages";
import { useMessageEvents } from "../hooks/useMessageEvents";
import { useMessageRealtime } from "../hooks/useMessageRealtime";
import { submitAssistantQuestion } from "../lib/assistantRuntime";
import { useAddChatParticipant, useChatParticipants, useRemoveChatParticipant, useUpdateChatParticipant } from "../hooks/useChatParticipants";

export function ChatPage() {
  const queryClient = useQueryClient();
  const me = useMe();
  const chatSessions = useChatSessions();
  const favorites = useFavorites();
  const csrfToken = me.data?.csrf_token ?? "";
  const addFavorite = useAddFavorite(csrfToken);
  const deleteFavorite = useDeleteFavorite(csrfToken);
  const createFeedback = useCreateFeedback(csrfToken);
  const createChatSession = useCreateChatSession(csrfToken);
  const updateChatSession = useUpdateChatSession(csrfToken);
  const deleteChatSession = useDeleteChatSession(csrfToken);
  const cancelAnswerGeneration = useCancelAnswerGeneration(csrfToken);
  const addChatParticipant = useAddChatParticipant(csrfToken);
  const updateChatParticipant = useUpdateChatParticipant(csrfToken);
  const removeChatParticipant = useRemoveChatParticipant(csrfToken);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(() => chatIdFromPath());
  const [messageId, setMessageId] = useState<string | null>(null);
  const [wsTicket, setWsTicket] = useState<string | null>(null);
  const [wsChannels, setWsChannels] = useState<string[]>([]);
  const chats = chatSessions.data?.chats ?? [];
  const activeChatId = selectedChatId ?? chats[0]?.chat_id ?? null;
  const participants = useChatParticipants(activeChatId);
  const messages = useChatMessages(activeChatId);
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

  useEffect(() => {
    function syncFromLocation() {
      setSelectedChatId(chatIdFromPath());
      setMessageId(null);
    }
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

  function selectChat(chatId: string) {
    setSelectedChatId(chatId);
    setMessageId(null);
    writeChatPath(chatId);
  }

  async function submit(question: string) {
    const hadActiveChat = Boolean(activeChatId);
    const chatId = await ensureActiveChatId(question);
    const accepted = await submitAssistantQuestion({ chatId, question, csrfToken });
    setMessageId(accepted.message_id);
    if (hadActiveChat) void messages.refetch();
    void queryClient.invalidateQueries({ queryKey: ["chat-messages", chatId] });
    const ticket = await apiPostOperation("issueWsTicket", apiRoutes.issueWsTicket(), { chat_id: chatId, message_id: accepted.message_id }, csrfToken);
    setWsTicket(ticket.ticket);
    setWsChannels(ticket.channels);
  }

  async function ensureActiveChatId(question: string) {
    if (activeChatId) return activeChatId;
    const created = await createChatSession.mutateAsync({ title: chatTitleFromQuestion(question) });
    selectChat(created.chat.chat_id);
    return created.chat.chat_id;
  }

  return (
    <AppShell
      className="sx-chat-shell"
      navigation={
        <ChatSessionNav
          chats={chats}
          selectedChatId={activeChatId}
          csrfToken={csrfToken}
          isMutating={createChatSession.isPending || updateChatSession.isPending || deleteChatSession.isPending}
          onSelect={selectChat}
          onCreate={async (input) => {
            const created = await createChatSession.mutateAsync(input);
            selectChat(created.chat.chat_id);
          }}
          onUpdate={(input) => updateChatSession.mutateAsync(input)}
          onDelete={(chatId) => {
            deleteChatSession.mutate({ chat_id: chatId });
            if (activeChatId === chatId) {
              setSelectedChatId(null);
              setMessageId(null);
              writeChatPath(null);
            }
          }}
        />
      }
    >
      <AssistantRuntimeBoundary csrfToken={csrfToken} chatId={activeChatId}>
        <MessageComposer csrfToken={csrfToken} onSubmit={submit} />
        <p role="status">リアルタイム接続: {realtime.status}</p>
        <ChatParticipantsPanel
          activeChatId={activeChatId}
          csrfToken={csrfToken}
          participants={participants.data?.participants ?? []}
          isLoading={participants.isFetching}
          isMutating={addChatParticipant.isPending || updateChatParticipant.isPending || removeChatParticipant.isPending}
          onAdd={(input) => addChatParticipant.mutateAsync(input)}
          onUpdate={(input) => updateChatParticipant.mutate(input)}
          onRemove={(input) => removeChatParticipant.mutate(input)}
        />
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
        <MessageHistoryPanel
          activeChatId={activeChatId}
          activeMessageId={messageId}
          csrfToken={csrfToken}
          messages={messages.data?.messages ?? []}
          nextCursor={messages.data?.next_cursor ?? null}
          isLoading={messages.isFetching}
          isCanceling={cancelAnswerGeneration.isPending}
          onCancel={(input) => cancelAnswerGeneration.mutate(input)}
        />
        <MessageEventsPanel events={events.data?.events ?? []} />
        <CitationDrawerPanel open={Boolean(activeChatId && csrfToken)} events={events.data?.events ?? []} />
      </AssistantRuntimeBoundary>
    </AppShell>
  );
}

function chatIdFromPath() {
  if (typeof window === "undefined") return null;
  const match = /^\/chat\/([^/?#]+)\/?$/.exec(window.location.pathname);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function writeChatPath(chatId: string | null) {
  if (typeof window === "undefined") return;
  const nextPath = chatId ? `/chat/${encodeURIComponent(chatId)}` : "/chat";
  if (window.location.pathname === nextPath) return;
  window.history.pushState({}, "", nextPath);
}

function chatTitleFromQuestion(question: string) {
  const title = question.trim().replace(/\s+/g, " ");
  if (!title) return "新規チャット";
  return title.length > 30 ? `${title.slice(0, 30)}...` : title;
}
