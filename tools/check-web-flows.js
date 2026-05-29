import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { performance } from "node:perf_hooks";
import { createLocalApi } from "../apps/api/src/local-api.js";
import { assert, readText } from "./lib.js";

const api = createLocalApi();
const routesSource = readText("apps/web/src/routes.ts");
const htmlSource = readText("apps/web/index.html");
const viteConfigSource = readText("apps/web/vite.config.ts");
const mainSource = readText("apps/web/src/main.tsx");
const chatSource = readText("apps/web/src/chat/ChatApp.tsx");
const chatPageSource = readText("apps/web/src/pages/ChatPage.tsx");
const chatNavSource = readText("apps/web/src/features/chat/ChatSessionNav.tsx");
const chatParticipantsPanelSource = readText("apps/web/src/features/chat/ChatParticipantsPanel.tsx");
const composerSource = readText("apps/web/src/features/chat/MessageComposer.tsx");
const messageHistoryPanelSource = readText("apps/web/src/features/chat/MessageHistoryPanel.tsx");
const eventsPanelSource = readText("apps/web/src/features/chat/MessageEventsPanel.tsx");
const citationDrawerSource = readText("apps/web/src/features/chat/CitationDrawerPanel.tsx");
const feedbackPanelSource = readText("apps/web/src/features/chat/FeedbackPanel.tsx");
const favoritePanelSource = readText("apps/web/src/features/chat/FavoritePanel.tsx");
const assistantRuntimeBoundarySource = readText("apps/web/src/features/chat/AssistantRuntimeBoundary.tsx");
const realtimeHookSource = readText("apps/web/src/hooks/useMessageRealtime.ts");
const realtimeClientSource = readText("apps/web/src/lib/realtimeClient.ts");
const adminSource = readText("apps/web/src/admin/AdminApp.tsx");
const adminPageSource = readText("apps/web/src/pages/AdminDashboardPage.tsx");
const adminActionsSource = readText("apps/web/src/features/admin/AdminActions.tsx");
const artifactTableSource = readText("apps/web/src/features/admin/ArtifactTable.tsx");
const documentRegistrationFormSource = readText("apps/web/src/features/admin/DocumentRegistrationForm.tsx");
const documentVersionLifecycleSource = readText("apps/web/src/features/admin/DocumentVersionLifecyclePanel.tsx");
const documentTableSource = readText("apps/web/src/features/admin/DocumentTable.tsx");
const ingestionJobPanelSource = readText("apps/web/src/features/admin/IngestionJobPanel.tsx");
const userImportPanelSource = readText("apps/web/src/features/admin/UserImportPanel.tsx");
const userTableSource = readText("apps/web/src/features/admin/UserTable.tsx");
const assistantRuntimeSource = readText("apps/web/src/lib/assistantRuntime.ts");
const meHookSource = readText("apps/web/src/hooks/useMe.ts");
const chatSessionsHookSource = readText("apps/web/src/hooks/useChatSessions.ts");
const chatParticipantsHookSource = readText("apps/web/src/hooks/useChatParticipants.ts");
const chatMessagesHookSource = readText("apps/web/src/hooks/useChatMessages.ts");
const feedbackHookSource = readText("apps/web/src/hooks/useCreateFeedback.ts");
const favoritesHookSource = readText("apps/web/src/hooks/useFavorites.ts");
const adminUsersHookSource = readText("apps/web/src/hooks/useAdminUsers.ts");
const userImportHookSource = readText("apps/web/src/hooks/useUserImport.ts");
const artifactsHookSource = readText("apps/web/src/hooks/useAdminArtifacts.ts");
const createDocumentHookSource = readText("apps/web/src/hooks/useCreateDocument.ts");
const documentLifecycleHookSource = readText("apps/web/src/hooks/useDocumentLifecycle.ts");
const documentsHookSource = readText("apps/web/src/hooks/useAdminDocuments.ts");
const ingestionJobHookSource = readText("apps/web/src/hooks/useIngestionJob.ts");
const startEvaluationHookSource = readText("apps/web/src/hooks/useStartEvaluationRun.ts");
const apiClientSource = readText("packages/api-client/src/client.ts");

const scenarios = [];
scenario("route role metadata", () => {
  assert(htmlSource.includes("/src/main.tsx"), "Vite HTML must load browser entrypoint");
  assert(viteConfigSource.includes("@vitejs/plugin-react"), "Vite config must use React plugin");
  assert(viteConfigSource.includes("@saphnexa/ui"), "Vite config must alias workspace UI package");
  assert(mainSource.includes("createRoot"), "browser entrypoint must mount React root");
  assert(mainSource.includes("<AdminApp />") && mainSource.includes("<ChatApp />"), "browser entrypoint must reach Chat and Admin apps");
  for (const [path, role] of [
    ["/chat", "general_user"],
    ["/chat/:chat_id", "general_user"],
    ["/admin", "admin"],
    ["/admin/docs/latest/", "admin"],
    ["/admin/docs/versions/v0.17/", "admin"],
    ["/admin/test-reports/allure/latest/", "admin"]
  ]) {
    assert(routesSource.includes(`path: "${path}"`), `route missing: ${path}`);
    assert(new RegExp(`path: "${escapeRegex(path)}".+role: "${role}"`).test(routesSource), `route role mismatch: ${path}`);
  }
});

scenario("chat UI source contract", () => {
  for (const token of [
    "QueryClientProvider",
    "ChatPage"
  ]) {
    assert(chatSource.includes(token), `ChatApp missing token: ${token}`);
  }
  for (const token of [
    "useChatSessions",
    "useCreateChatSession",
    "useUpdateChatSession",
    "useDeleteChatSession",
    "useChatParticipants",
    "useChatMessages",
    "useCancelAnswerGeneration",
    "useAddChatParticipant",
    "useUpdateChatParticipant",
    "useRemoveChatParticipant",
    "useMessageEvents",
    "useMessageRealtime",
    "useCreateFeedback",
    "useFavorites",
    "useAddFavorite",
    "useDeleteFavorite",
    "ChatParticipantsPanel",
    "MessageHistoryPanel",
    "CitationDrawerPanel",
    "FeedbackPanel",
    "FavoritePanel",
    "AssistantRuntimeBoundary",
    "submitAssistantQuestion",
    "ensureActiveChatId",
    "chatTitleFromQuestion",
    "createChatSession.mutateAsync({ title: chatTitleFromQuestion(question) })",
    "selectChat(created.chat.chat_id)",
    "setMessageId(accepted.message_id)",
    "messages.refetch()",
    "invalidateQueries({ queryKey: [\"chat-messages\", chatId] })",
    "setWsChannels(ticket.channels)",
    "events.refetch()",
    "chatIdFromPath",
    "window.history.pushState",
    "popstate"
  ]) {
    assert(chatPageSource.includes(token), `ChatPage missing token: ${token}`);
  }
  assert(meHookSource.includes("apiRoutes.getMe()"), "useMe hook must use getMe route helper");
  assert(apiClientSource.includes("/api/me"), "API client getMe helper must call /api/me");
  assert(chatSessionsHookSource.includes("apiRoutes.listChatSessions()"), "useChatSessions hook must use listChatSessions route helper");
  assert(chatSessionsHookSource.includes("apiRoutes.createChatSession()"), "useCreateChatSession hook must use createChatSession route helper");
  assert(chatSessionsHookSource.includes("apiPostOperation(\"createChatSession\""), "useCreateChatSession hook must use generated createChatSession helper");
  assert(chatSessionsHookSource.includes("apiRoutes.updateChatSession(input.chat_id)"), "useUpdateChatSession hook must use updateChatSession route helper");
  assert(chatSessionsHookSource.includes("apiPatchOperation(\"updateChatSession\""), "useUpdateChatSession hook must use generated updateChatSession helper");
  assert(chatSessionsHookSource.includes("apiRoutes.deleteChatSession(input.chat_id)"), "useDeleteChatSession hook must use deleteChatSession route helper");
  assert(chatSessionsHookSource.includes("apiDeleteOperation(\"deleteChatSession\""), "useDeleteChatSession hook must use generated deleteChatSession helper");
  assert(chatSessionsHookSource.includes("invalidateQueries({ queryKey: [\"chat-sessions\"] })"), "chat session mutations must refresh chat sessions query");
  assert(apiClientSource.includes("/api/chat-sessions"), "API client chat sessions helper must call /api/chat-sessions");
  assert(chatParticipantsHookSource.includes("apiRoutes.listChatParticipants(chatId ?? \"\")"), "useChatParticipants hook must use listChatParticipants route helper");
  assert(chatParticipantsHookSource.includes("apiGetOperation(\"listChatParticipants\""), "useChatParticipants hook must use generated listChatParticipants helper");
  assert(chatParticipantsHookSource.includes("enabled: Boolean(chatId)"), "useChatParticipants hook must wait for active chat");
  assert(chatParticipantsHookSource.includes("apiRoutes.addChatParticipant(input.chat_id)"), "useAddChatParticipant hook must use addChatParticipant route helper");
  assert(chatParticipantsHookSource.includes("apiPostOperation(\"addChatParticipant\""), "useAddChatParticipant hook must use generated addChatParticipant helper");
  assert(chatParticipantsHookSource.includes("apiRoutes.updateChatParticipant(input.chat_id, input.user_id)"), "useUpdateChatParticipant hook must use updateChatParticipant route helper");
  assert(chatParticipantsHookSource.includes("apiPatchOperation(\"updateChatParticipant\""), "useUpdateChatParticipant hook must use generated updateChatParticipant helper");
  assert(chatParticipantsHookSource.includes("apiRoutes.removeChatParticipant(input.chat_id, input.user_id)"), "useRemoveChatParticipant hook must use removeChatParticipant route helper");
  assert(chatParticipantsHookSource.includes("apiDeleteOperation(\"removeChatParticipant\""), "useRemoveChatParticipant hook must use generated removeChatParticipant helper");
  assert(chatParticipantsHookSource.includes("invalidateQueries({ queryKey: [\"chat-participants\", input.chat_id] })"), "participant mutations must refresh participants query");
  assert(apiClientSource.includes("/api/chat-sessions/{chat_id}/participants"), "API client participants helper must call participants path");
  assert(chatMessagesHookSource.includes("apiRoutes.listMessages(chatId ?? \"\", \"\", \"50\")"), "useChatMessages hook must use listMessages route helper with page limit");
  assert(chatMessagesHookSource.includes("apiGetOperation(\"listMessages\""), "useChatMessages hook must use generated listMessages operation helper");
  assert(chatMessagesHookSource.includes("next_cursor: response.next_cursor"), "useChatMessages hook must expose message next cursor");
  assert(chatMessagesHookSource.includes("enabled: Boolean(chatId)"), "useChatMessages hook must wait for active chat");
  assert(chatMessagesHookSource.includes("apiRoutes.cancelAnswerGeneration(input.chat_id, input.message_id)"), "useCancelAnswerGeneration hook must use cancelAnswerGeneration route helper");
  assert(chatMessagesHookSource.includes("apiPostOperation(\"cancelAnswerGeneration\""), "useCancelAnswerGeneration hook must use generated cancelAnswerGeneration helper");
  assert(chatMessagesHookSource.includes("invalidateQueries({ queryKey: [\"message-events\", input.chat_id, input.message_id] })"), "answer cancel mutation must refresh message events query");
  assert(apiClientSource.includes("/api/chat-sessions/{chat_id}/messages"), "API client listMessages helper must call messages path");
  assert(feedbackHookSource.includes("apiRoutes.createFeedback(input.chat_id, input.message_id)"), "useCreateFeedback hook must use createFeedback route helper");
  assert(feedbackHookSource.includes("apiPostOperation(\"createFeedback\""), "useCreateFeedback hook must use generated createFeedback helper");
  assert(apiClientSource.includes("/api/chat-sessions/{chat_id}/messages/{message_id}/feedback"), "API client feedback helper must call feedback path");
  assert(favoritesHookSource.includes("apiRoutes.listFavorites()"), "useFavorites hook must use listFavorites route helper");
  assert(favoritesHookSource.includes("apiGetOperation(\"listFavorites\""), "useFavorites hook must use generated listFavorites helper");
  assert(favoritesHookSource.includes("apiRoutes.addFavorite()"), "useAddFavorite hook must use addFavorite route helper");
  assert(favoritesHookSource.includes("apiPostOperation(\"addFavorite\""), "useAddFavorite hook must use generated addFavorite helper");
  assert(favoritesHookSource.includes("apiRoutes.deleteFavorite(input.favorite_id)"), "useDeleteFavorite hook must use deleteFavorite route helper");
  assert(favoritesHookSource.includes("apiDeleteOperation(\"deleteFavorite\""), "useDeleteFavorite hook must use generated deleteFavorite helper");
  assert(favoritesHookSource.includes("invalidateQueries({ queryKey: [\"favorites\"] })"), "favorite mutations must refresh favorite query");
  assert(apiClientSource.includes("/api/favorites"), "API client favorites helper must call /api/favorites");
  for (const token of [
    "Sidebar",
    "aria-label=\"チャット一覧\"",
    "role=\"status\"",
    "チャットはありません",
    "aria-label=\"新規チャット作成フォーム\"",
    "newChatSchema",
    "新規チャット名",
    "新規チャット",
    "chat session audit event append: 接続済み",
    "disabled={!props.csrfToken || props.isMutating}",
    "aria-label=\"チャットタイトル更新フォーム\"",
    "chatTitleSchema",
    "チャットタイトル",
    "タイトル更新",
    "削除",
    "保持期間後物理削除、SQS/AppSync publish: 未接続",
    "disabled={!props.csrfToken || !props.selectedChatId || props.isMutating}",
    "disabled={!props.csrfToken || chat.chat_id !== props.selectedChatId || props.isMutating}"
  ]) {
    assert(chatNavSource.includes(token), `ChatSessionNav missing token: ${token}`);
  }
  for (const token of [
    "aria-label=\"参加者\"",
    "DataTable",
    "参加者一覧",
    "チャットを選択してください",
    "StatusBadge",
    "added_by_user_id",
    "aria-label=\"チャット共有フォーム\"",
    "shareParticipantSchema",
    "viewerとして共有",
    "viewer再有効化",
    "ownerを移譲",
    "participant_role: \"owner\"",
    "共有解除",
    "任意owner昇格、実 AppSync Events fan-out: 未接続"
  ]) {
    assert(chatParticipantsPanelSource.includes(token), `ChatParticipantsPanel missing token: ${token}`);
  }
  for (const token of [
    "aria-label=\"質問\"",
    "useForm",
    "zodResolver",
    "questionSchema",
    "disabled={!props.csrfToken || !question}"
  ]) {
    assert(composerSource.includes(token), `MessageComposer missing token: ${token}`);
  }
  for (const token of [
    "aria-label=\"メッセージ履歴\"",
    "MessageThread",
    "メッセージはありません",
    "チャットを選択してください",
    "メッセージ履歴を確認しています",
    "引用 REST 復元: 接続済み",
    "message.citations",
    "次ページcursor:",
    "実 AgentCore Runtime 停止、SQS event-publish、stream中断: 未接続",
    "message.feedback",
    "フィードバック:",
    "回答お気に入り登録",
    "回答お気に入り解除",
    "onAddMessageFavorite",
    "onDeleteFavorite",
    "回答生成キャンセル要求",
    "disabled={!props.csrfToken || !props.activeChatId || !props.activeMessageId || props.isCanceling}",
    "StatusBadge",
    "message.content_text || \"本文未確定\""
  ]) {
    assert(messageHistoryPanelSource.includes(token), `MessageHistoryPanel missing token: ${token}`);
  }
  for (const token of [
    "MessageThread",
    "aria-label=\"イベント\"",
    "emptyLabel=\"イベントはありません\""
  ]) {
    assert(eventsPanelSource.includes(token), `MessageEventsPanel missing token: ${token}`);
  }
  for (const token of [
    "DataTable",
    "aria-label=\"お気に入り\"",
    "お気に入り一覧",
    "お気に入りはありません",
    "disabled={!props.csrfToken || !props.activeChatId || props.isMutating}",
    "activeFavorite ? \"お気に入り解除\" : \"お気に入り登録\""
  ]) {
    assert(favoritePanelSource.includes(token), `FavoritePanel missing token: ${token}`);
  }
  for (const token of [
    "aria-label=\"回答フィードバック\"",
    "Textarea",
    "aria-label=\"フィードバックコメント\"",
    "フィードバックを登録しました",
    "高評価",
    "低評価"
  ]) {
    assert(feedbackPanelSource.includes(token), `FeedbackPanel missing token: ${token}`);
  }
  for (const token of [
    "@assistant-ui/react",
    "apiRoutes.submitQuestion",
    "apiPostOperation",
    "\"submitQuestion\"",
    "submitAssistantQuestion"
  ]) {
    assert(assistantRuntimeSource.includes(token), `assistant runtime missing token: ${token}`);
  }
  for (const token of [
    "AssistantRuntimeProvider",
    "useLocalRuntime",
    "createSaphnexaAssistantAdapter",
    "!props.chatId || !props.csrfToken"
  ]) {
    assert(assistantRuntimeBoundarySource.includes(token), `assistant runtime boundary missing token: ${token}`);
  }
  for (const token of [
    "CitationDrawer",
    "extractRestCitations",
    "extractEventCitations",
    "event.payload_json.citations",
    "message.citations",
    "dedupeCitations"
  ]) {
    assert(citationDrawerSource.includes(token), `CitationDrawerPanel missing token: ${token}`);
  }
  for (const token of [
    "createAppSyncEventsClient()",
    "onNotification"
  ]) {
    assert(realtimeHookSource.includes(token), `useMessageRealtime missing token: ${token}`);
  }
  assert(realtimeClientSource.includes("endpoint = \"/event/realtime\""), "realtime client must default to same-origin /event/realtime");
  assert(realtimeClientSource.includes("socket.send(JSON.stringify({ type: \"subscribe\", ticket: input.ticket, channels: input.channels }))"), "realtime client must send ticket in subscribe payload");
  assert(!realtimeClientSource.includes("ticket="), "realtime client must not put ticket in the WebSocket URL query");
  assert(!realtimeClientSource.includes("chat_id="), "realtime client must not put chat_id in the WebSocket URL query");
  assert(!realtimeClientSource.includes("message_id="), "realtime client must not put message_id in the WebSocket URL query");
  assert(!realtimeHookSource.includes("VITE_APPSYNC_EVENTS_URL"), "web realtime hook must not depend on AWS service domain env");
  assert(realtimeClientSource.includes("input.channels.length === 0"), "realtime client must not generate fake channels when none are authorized");
  assert(!/useState<Chat\[\]>\(\[[^\]]/.test(chatPageSource), "ChatPage must not seed fake chats");
  assert(!/useState<EventRow\[\]>\(\[[^\]]/.test(chatPageSource), "ChatPage must not seed fake events");
});

scenario("chat local API flow", () => {
  const csrf = api.request("user-owner", "getMe").body.csrf_token;
  const chat = api.request("user-owner", "createChatSession", { csrf_token: csrf, title: "flow chat" });
  assert(chat.status === 201, "chat creation failed");
  assert(api.store.state.audit_events.some((event) => event.event_name === "chat.session.created" && event.resource_id === chat.body.chat.chat_id), "chat creation audit event missing");
  const createdDetail = api.request("user-owner", "getChatSession", { chat_id: chat.body.chat.chat_id });
  assert(createdDetail.status === 200 && createdDetail.body.chat.participants.some((item) => item.user_id === "user-owner" && item.participant_role === "owner"), "created chat detail must include owner participant");
  assert(api.request("user-outsider", "getChatSession", { chat_id: chat.body.chat.chat_id }).status === 403, "outsider must not get unreadable chat detail");
  const renamed = api.request("user-owner", "updateChatSession", { csrf_token: csrf, chat_id: chat.body.chat.chat_id, title: "renamed flow chat" });
  assert(renamed.status === 200 && renamed.body.chat.title === "renamed flow chat", "owner must update chat title");
  assert(api.store.state.audit_events.some((event) => event.event_name === "chat.session.title_updated" && event.resource_id === chat.body.chat.chat_id), "chat title update audit event missing");
  const auditCountBeforeOutsiderUpdate = api.store.state.audit_events.length;
  assert(api.request("user-outsider", "updateChatSession", { csrf_token: "csrf-user-outsider", chat_id: chat.body.chat.chat_id, title: "outsider title" }).status === 403, "outsider must not update unreadable chat");
  assert(api.store.state.audit_events.length === auditCountBeforeOutsiderUpdate, "failed outsider update must not append audit event");
  const submit = api.request("user-owner", "submitQuestion", {
    csrf_token: csrf,
    chat_id: chat.body.chat.chat_id,
    question: "Saphnexa は何をするシステムか",
    retrieval_policy: { top_k: 10, allowed_acl_scope_ids: ["user:user-owner"] }
  });
  assert(submit.status === 202, "chat submit failed");
  const events = api.request("user-owner", "listMessageEvents", { chat_id: chat.body.chat.chat_id, message_id: submit.body.message_id });
  assert(events.status === 200, "chat events fetch failed");
  assert(events.body.events.some((event) => event.event_name === "chat.message.final_ready"), "final event missing");
  const finalEvent = events.body.events.find((event) => event.event_name === "chat.message.final_ready");
  assert(Array.isArray(finalEvent.payload_json.citations), "final event citations missing");
  const participants = api.request("user-owner", "listChatParticipants", { chat_id: chat.body.chat.chat_id });
  assert(participants.status === 200, "chat participants fetch failed");
  assert(participants.body.participants.some((item) => item.user_id === "user-owner" && item.participant_role === "owner"), "owner participant missing");
  assert(api.request("user-outsider", "listChatParticipants", { chat_id: chat.body.chat.chat_id }).status === 403, "outsider must not list participants for unreadable chat");
  const shared = api.request("user-owner", "addChatParticipant", { csrf_token: csrf, chat_id: chat.body.chat.chat_id, user_id: "user-viewer" });
  assert(shared.status === 201 && shared.body.participant.participant_role === "viewer", "owner must share chat with viewer");
  assert(api.request("user-viewer", "updateChatSession", { csrf_token: "csrf-user-viewer", chat_id: chat.body.chat.chat_id, title: "viewer title" }).status === 403, "viewer must not update chat title");
  assert(api.request("user-viewer", "addChatParticipant", { csrf_token: "csrf-user-viewer", chat_id: chat.body.chat.chat_id, user_id: "user-outsider" }).status === 403, "viewer must not share chat");
  assert(api.request("user-outsider", "addChatParticipant", { csrf_token: "csrf-user-outsider", chat_id: chat.body.chat.chat_id, user_id: "user-viewer" }).status === 403, "outsider must not share unreadable chat");
  const removedParticipant = api.request("user-owner", "removeChatParticipant", { csrf_token: csrf, chat_id: chat.body.chat.chat_id, user_id: "user-viewer" });
  assert(removedParticipant.status === 204, "owner must remove viewer participant");
  assert(api.request("user-viewer", "listChatParticipants", { chat_id: chat.body.chat.chat_id }).status === 403, "removed viewer must not list participants");
  const reenabledParticipant = api.request("user-owner", "updateChatParticipant", { csrf_token: csrf, chat_id: chat.body.chat.chat_id, user_id: "user-viewer", participant_role: "viewer" });
  assert(reenabledParticipant.status === 200 && reenabledParticipant.body.participant.status === "active", "owner must re-enable viewer participant");
  const transferredOwner = api.request("user-owner", "updateChatParticipant", { csrf_token: csrf, chat_id: chat.body.chat.chat_id, user_id: "user-viewer", participant_role: "owner" });
  assert(transferredOwner.status === 200 && transferredOwner.body.participant.participant_role === "owner", "owner must transfer ownership to an active viewer");
  const afterOwnerTransfer = api.request("user-viewer", "listChatParticipants", { chat_id: chat.body.chat.chat_id });
  assert(afterOwnerTransfer.body.participants.filter((item) => item.participant_role === "owner").length === 1, "owner transfer must keep exactly one active owner");
  assert(afterOwnerTransfer.body.participants.some((item) => item.user_id === "user-owner" && item.participant_role === "viewer"), "previous owner must become viewer after transfer");
  assert(api.store.state.audit_events.some((event) => event.event_name === "chat.participant.owner_transferred" && event.resource_id === chat.body.chat.chat_id), "owner transfer audit event missing");
  assert(api.request("user-owner", "updateChatSession", { csrf_token: csrf, chat_id: chat.body.chat.chat_id, title: "old owner title" }).status === 403, "previous owner must not keep owner-only update permission");
  assert(api.request("user-viewer", "updateChatSession", { csrf_token: "csrf-user-viewer", chat_id: chat.body.chat.chat_id, title: "new owner title" }).status === 200, "new owner must be able to update chat title");
  assert(api.request("user-owner", "updateChatParticipant", { csrf_token: csrf, chat_id: chat.body.chat.chat_id, user_id: "user-owner", participant_role: "owner" }).status === 403, "viewer must not transfer ownership back");
  assert(api.request("user-outsider", "updateChatParticipant", { csrf_token: "csrf-user-outsider", chat_id: chat.body.chat.chat_id, user_id: "user-owner", participant_role: "owner" }).status === 403, "outsider must not transfer ownership");
  assert(api.request("user-owner", "removeChatParticipant", { csrf_token: csrf, chat_id: chat.body.chat.chat_id, user_id: "user-owner" }).status === 403, "owner participant must not be removable");
  const messages = api.request("user-owner", "listMessages", { chat_id: chat.body.chat.chat_id });
  assert(messages.status === 200, "chat messages fetch failed");
  assert(messages.body.messages.some((message) => message.message_id === submit.body.message_id && message.sender_type === "assistant"), "assistant message missing from message history");
  assert(messages.body.messages.some((message) => message.sender_user_id === "user-owner" && message.content_text.includes("Saphnexa")), "user message missing from message history");
  const restoredAnswer = messages.body.messages.find((message) => message.message_id === submit.body.message_id);
  assert(restoredAnswer.citations.length >= 1, "message history must restore citations from REST");
  assert(restoredAnswer.citations.every((citation) => citation.display?.document_name), "restored citations must include display metadata");
  const pagedMessages = api.request("user-owner", "listMessages", { chat_id: chat.body.chat.chat_id, limit: 1 });
  assert(pagedMessages.body.messages.length === 1 && pagedMessages.body.next_cursor, "message history must return first page cursor");
  const nextMessages = api.request("user-owner", "listMessages", { chat_id: chat.body.chat.chat_id, after_message_id: pagedMessages.body.next_cursor, limit: 1 });
  assert(nextMessages.body.messages.length === 1 && nextMessages.body.messages[0].message_id !== pagedMessages.body.messages[0].message_id, "message history cursor must return non-overlapping next page");
  assert(api.request("user-outsider", "listMessages", { chat_id: chat.body.chat.chat_id }).status === 403, "outsider must not list messages for unreadable chat");
  const cancelTarget = api.request("user-owner", "createChatSession", { csrf_token: csrf, title: "cancel target" });
  const cancelSubmit = api.request("user-owner", "submitQuestion", {
    csrf_token: csrf,
    chat_id: cancelTarget.body.chat.chat_id,
    question: "キャンセル境界を確認する"
  });
  assert(cancelSubmit.status === 202, "cancel target submit failed");
  const cancelShare = api.request("user-owner", "addChatParticipant", { csrf_token: csrf, chat_id: cancelTarget.body.chat.chat_id, user_id: "user-viewer" });
  assert(cancelShare.status === 201, "cancel target share failed");
  assert(api.request("user-viewer", "cancelAnswerGeneration", { csrf_token: "csrf-user-viewer", chat_id: cancelTarget.body.chat.chat_id, message_id: cancelSubmit.body.message_id }).status === 403, "viewer must not cancel owner requested answer");
  assert(api.request("user-outsider", "cancelAnswerGeneration", { csrf_token: "csrf-user-outsider", chat_id: cancelTarget.body.chat.chat_id, message_id: cancelSubmit.body.message_id }).status === 403, "outsider must not cancel unreadable answer");
  const canceled = api.request("user-owner", "cancelAnswerGeneration", { csrf_token: csrf, chat_id: cancelTarget.body.chat.chat_id, message_id: cancelSubmit.body.message_id, reason: "local source gate" });
  assert(canceled.status === 202 && canceled.body.status === "canceled", "owner must cancel answer generation");
  const cancelMessages = api.request("user-owner", "listMessages", { chat_id: cancelTarget.body.chat.chat_id });
  assert(cancelMessages.body.messages.some((message) => message.message_id === cancelSubmit.body.message_id && message.status === "canceled"), "canceled message status missing");
  const cancelEvents = api.request("user-owner", "listMessageEvents", { chat_id: cancelTarget.body.chat.chat_id, message_id: cancelSubmit.body.message_id });
  assert(cancelEvents.body.events.some((event) => event.event_name === "chat.run.canceled"), "cancel event missing");
  const feedback = api.request("user-owner", "createFeedback", {
    csrf_token: csrf,
    chat_id: chat.body.chat.chat_id,
    message_id: submit.body.message_id,
    rating: "positive",
    comment: "参考になりました"
  });
  assert(feedback.status === 201, "feedback creation failed");
  assert(feedback.body.feedback.rating === "positive", "feedback rating missing");
  const feedbackMessages = api.request("user-owner", "listMessages", { chat_id: chat.body.chat.chat_id });
  const feedbackMessage = feedbackMessages.body.messages.find((message) => message.message_id === submit.body.message_id);
  assert(feedbackMessage?.feedback?.rating === "positive", "own feedback rating must be restored in message history");
  assert(feedbackMessage?.feedback?.comment === "参考になりました", "own feedback comment must be restored in message history");
  assert(feedbackMessage?.citations?.length >= 1, "own message history must keep restored citations with feedback state");
  const viewerFeedbackMessages = api.request("user-viewer", "listMessages", { chat_id: chat.body.chat.chat_id });
  const viewerFeedbackMessage = viewerFeedbackMessages.body.messages.find((message) => message.message_id === submit.body.message_id);
  assert(viewerFeedbackMessage?.feedback === null, "message history must not expose another participant feedback state");
  const outsiderFeedback = api.request("user-outsider", "createFeedback", {
    csrf_token: "csrf-user-outsider",
    chat_id: chat.body.chat.chat_id,
    message_id: submit.body.message_id,
    rating: "negative"
  });
  assert(outsiderFeedback.status === 403, "outsider must not create feedback for unreadable chat");
  const favorite = api.request("user-owner", "addFavorite", { csrf_token: csrf, chat_id: chat.body.chat.chat_id });
  assert(favorite.status === 201, "favorite creation failed");
  const messageFavorite = api.request("user-owner", "addFavorite", { csrf_token: csrf, chat_id: chat.body.chat.chat_id, message_id: submit.body.message_id });
  assert(messageFavorite.status === 201, "message favorite creation failed");
  const duplicateMessageFavorite = api.request("user-owner", "addFavorite", { csrf_token: csrf, chat_id: chat.body.chat.chat_id, message_id: submit.body.message_id });
  assert(duplicateMessageFavorite.body.favorite.favorite_id === messageFavorite.body.favorite.favorite_id, "message favorite must be deduplicated");
  assert(api.store.state.favorites.filter((item) => item.chat_id === chat.body.chat.chat_id && item.message_id === submit.body.message_id).length === 1, "duplicate message favorite leaked into store");
  const userMessage = messages.body.messages.find((message) => message.sender_user_id === "user-owner");
  assert(api.request("user-owner", "addFavorite", { csrf_token: csrf, chat_id: chat.body.chat.chat_id, message_id: userMessage.message_id }).status === 404, "user message favorite must be rejected");
  const outsiderFavorite = api.request("user-outsider", "addFavorite", { csrf_token: "csrf-user-outsider", chat_id: chat.body.chat.chat_id });
  assert(outsiderFavorite.status === 403, "outsider must not favorite unreadable chat");
  const favorites = api.request("user-owner", "listFavorites");
  assert(favorites.status === 200, "favorites fetch failed");
  assert(favorites.body.favorites.some((item) => item.favorite_id === favorite.body.favorite.favorite_id), "created favorite missing from list");
  const deleted = api.request("user-owner", "deleteFavorite", { csrf_token: csrf, favorite_id: favorite.body.favorite.favorite_id });
  assert(deleted.status === 204, "favorite deletion failed");
  const favoritesAfterDelete = api.request("user-owner", "listFavorites");
  assert(!favoritesAfterDelete.body.favorites.some((item) => item.favorite_id === favorite.body.favorite.favorite_id), "deleted favorite leaked into list");
  const deleteTarget = api.request("user-owner", "createChatSession", { csrf_token: csrf, title: "delete target" });
  const deleteTargetId = deleteTarget.body.chat.chat_id;
  const deleteShare = api.request("user-owner", "addChatParticipant", { csrf_token: csrf, chat_id: deleteTargetId, user_id: "user-viewer" });
  assert(deleteShare.status === 201, "delete target share failed");
  assert(api.request("user-viewer", "deleteChatSession", { csrf_token: "csrf-user-viewer", chat_id: deleteTargetId }).status === 403, "viewer must not delete chat");
  assert(api.request("user-outsider", "deleteChatSession", { csrf_token: "csrf-user-outsider", chat_id: deleteTargetId }).status === 403, "outsider must not delete unreadable chat");
  const auditCountBeforeDelete = api.store.state.audit_events.length;
  const deletedChat = api.request("user-owner", "deleteChatSession", { csrf_token: csrf, chat_id: deleteTargetId });
  assert(deletedChat.status === 204, "owner must delete chat");
  assert(api.store.state.audit_events.length === auditCountBeforeDelete + 1, "chat deletion must append one audit event");
  assert(api.store.state.audit_events.some((event) => event.event_name === "chat.session.deleted" && event.resource_id === deleteTargetId && event.payload_json.physical_delete === false), "chat deletion audit event missing");
  const chatsAfterDelete = api.request("user-owner", "listChatSessions");
  assert(!chatsAfterDelete.body.chats.some((item) => item.chat_id === deleteTargetId), "deleted chat leaked into list");
  assert(api.request("user-owner", "getChatSession", { chat_id: deleteTargetId }).status === 404, "deleted chat must not be readable through normal get");
});

scenario("admin UI source contract", () => {
  for (const token of [
    "AdminDashboardPage"
  ]) {
    assert(adminSource.includes(token), `AdminApp missing token: ${token}`);
  }
  for (const token of [
    "useAdminArtifacts",
    "useAdminUsers",
    "UserImportPanel",
    "UserTable",
    "useAdminDocuments",
    "DocumentRegistrationForm",
    "DocumentVersionLifecyclePanel",
    "IngestionJobPanel",
    "DocumentTable",
    "aria-label=\"成果物\""
  ]) {
    assert(adminPageSource.includes(token), `AdminDashboardPage missing token: ${token}`);
  }
  assert(meHookSource.includes("apiRoutes.getMe()"), "useMe hook must use getMe route helper");
  assert(meHookSource.includes("apiGetOperation(\"getMe\""), "useMe hook must use generated getMe operation helper");
  assert(artifactsHookSource.includes("apiRoutes.listPublishedArtifacts()"), "useAdminArtifacts hook must use listPublishedArtifacts route helper");
  assert(artifactsHookSource.includes("apiGetOperation(\"listPublishedArtifacts\""), "useAdminArtifacts hook must use generated artifacts operation helper");
  assert(adminUsersHookSource.includes("apiRoutes.adminListUsers()"), "useAdminUsers hook must use adminListUsers route helper");
  assert(adminUsersHookSource.includes("apiGetOperation(\"adminListUsers\""), "useAdminUsers hook must use generated adminListUsers operation helper");
  assert(userImportHookSource.includes("apiRoutes.startUserImport()"), "useStartUserImport hook must use startUserImport route helper");
  assert(userImportHookSource.includes("apiPostOperation(\"startUserImport\""), "useStartUserImport hook must use generated startUserImport operation helper");
  assert(userImportHookSource.includes("apiRoutes.getUserImport(importId)"), "useUserImportResult hook must use getUserImport route helper");
  assert(userImportHookSource.includes("apiGetOperation(\"getUserImport\""), "useUserImportResult hook must use generated getUserImport operation helper");
  assert(userImportHookSource.includes("invalidateQueries({ queryKey: [\"admin-users\"] })"), "user import hook must refresh admin users query");
  assert(apiClientSource.includes("/api/admin/artifacts"), "API client artifacts helper must call /api/admin/artifacts");
  assert(apiClientSource.includes("/api/admin/users"), "API client admin users helper must call /api/admin/users");
  assert(apiClientSource.includes("/api/admin/user-imports"), "API client user import helper must call /api/admin/user-imports");
  assert(documentsHookSource.includes("apiRoutes.adminListDocuments()"), "useAdminDocuments hook must use adminListDocuments route helper");
  assert(documentsHookSource.includes("apiGetOperation(\"adminListDocuments\""), "useAdminDocuments hook must use generated documents operation helper");
  assert(createDocumentHookSource.includes("apiRoutes.createDocument()"), "useCreateDocument hook must use createDocument route helper");
  assert(createDocumentHookSource.includes("apiPostOperation(\"createDocument\""), "useCreateDocument hook must use generated createDocument operation helper");
  assert(createDocumentHookSource.includes("invalidateQueries({ queryKey: [\"admin-documents\"] })"), "useCreateDocument hook must refresh admin documents query");
  assert(documentLifecycleHookSource.includes("apiRoutes.getDocument(documentId)"), "useDocumentDetail hook must use getDocument route helper");
  assert(documentLifecycleHookSource.includes("apiGetOperation(\"getDocument\""), "useDocumentDetail hook must use generated getDocument operation helper");
  assert(documentLifecycleHookSource.includes("apiRoutes.createDocumentVersion(input.document_id)"), "useCreateDocumentVersion hook must use createDocumentVersion route helper");
  assert(documentLifecycleHookSource.includes("apiPostOperation(\"createDocumentVersion\""), "useCreateDocumentVersion hook must use generated createDocumentVersion operation helper");
  assert(documentLifecycleHookSource.includes("apiRoutes.activateDocumentVersion(input.document_id, input.version_id)"), "useActivateDocumentVersion hook must use activateDocumentVersion route helper");
  assert(documentLifecycleHookSource.includes("apiPostOperation(\"activateDocumentVersion\""), "useActivateDocumentVersion hook must use generated activateDocumentVersion operation helper");
  assert(documentLifecycleHookSource.includes("apiRoutes.updateDocumentAcl(input.document_id, input.version_id)"), "useUpdateDocumentAcl hook must use updateDocumentAcl route helper");
  assert(documentLifecycleHookSource.includes("apiPostOperation(\"updateDocumentAcl\""), "useUpdateDocumentAcl hook must use generated updateDocumentAcl operation helper");
  assert(documentLifecycleHookSource.includes("apiRoutes.suspendDocument(input.document_id)"), "useSuspendDocument hook must use suspendDocument route helper");
  assert(documentLifecycleHookSource.includes("apiPostOperation(\"suspendDocument\""), "useSuspendDocument hook must use generated suspendDocument operation helper");
  assert(documentLifecycleHookSource.includes("invalidateQueries({ queryKey: [\"admin-document-detail\", input.document_id] })"), "document lifecycle hook must refresh document detail query");
  assert(ingestionJobHookSource.includes("apiRoutes.getIngestionJob(jobId)"), "useIngestionJob hook must use getIngestionJob route helper");
  assert(ingestionJobHookSource.includes("apiGetOperation(\"getIngestionJob\""), "useIngestionJob hook must use generated getIngestionJob operation helper");
  assert(ingestionJobHookSource.includes("apiRoutes.retryIngestionJob(jobId)"), "useRetryIngestionJob hook must use retryIngestionJob route helper");
  assert(ingestionJobHookSource.includes("apiPostOperation(\"retryIngestionJob\""), "useRetryIngestionJob hook must use generated retryIngestionJob operation helper");
  assert(ingestionJobHookSource.includes("invalidateQueries({ queryKey: [\"ingestion-job\", jobId] })"), "useRetryIngestionJob hook must refresh ingestion job query");
  assert(apiClientSource.includes("/api/admin/documents"), "API client documents helper must call /api/admin/documents");
  assert(apiClientSource.includes("/api/admin/ingestion-jobs/{job_id}"), "API client ingestion job helper must call /api/admin/ingestion-jobs/{job_id}");
  for (const token of [
    "useForm",
    "zodResolver",
    "documentRegistrationSchema",
    "FormField",
    "Dialog",
    "disabled={!props.csrfToken || createDocument.isPending}",
    "PDF実アップロード: 未接続",
    "role=\"alert\""
  ]) {
    assert(documentRegistrationFormSource.includes(token), `DocumentRegistrationForm missing token: ${token}`);
  }
  for (const token of [
    "useForm",
    "zodResolver",
    "documentLookupSchema",
    "versionSchema",
    "文書版ライフサイクル",
    "DataTable",
    "文書版一覧",
    "文書ACL一覧",
    "文書取り込みジョブ一覧",
    "PDF実アップロードとStep Functions実行: 未接続",
    "Cognito group反映、Bedrock KB / S3 Vectors metadata再同期: 未接続",
    "物理削除、S3 object delete、Bedrock KB / S3 Vectors delete: 未接続",
    "disabled={!props.csrfToken || !documentId || !aclVersionId || !aclScopeId || updateDocumentAcl.isPending}",
    "disabled={!props.csrfToken || version.status !== \"succeeded\" || activateVersion.isPending}",
    "disabled={!props.csrfToken || document.status === \"deleted\" || suspendDocument.isPending}",
    "role=\"alert\""
  ]) {
    assert(documentVersionLifecycleSource.includes(token), `DocumentVersionLifecyclePanel missing token: ${token}`);
  }
  for (const token of [
    "aria-label=\"管理操作\"",
    "role=\"status\"",
    "DataTable",
    "評価データセット一覧",
    "評価データセットはありません",
    "useEvaluationDatasets",
    "useLlmModels",
    "useEvaluationRun",
    "評価モデル一覧",
    "評価モデルはありません",
    "評価モデルID",
    "disabled={!props.csrfToken || !datasetId || !modelId}",
    "setJobStatus(response.evaluation_run.status)",
    "評価run ID",
    "評価run詳細",
    "評価case別結果",
    "evaluationRun.data?.items",
    "Step Functions評価runner、Bedrock Evaluations job、評価HTML report、AppSync fan-out: 未接続"
  ]) {
    assert(adminActionsSource.includes(token), `AdminActions missing token: ${token}`);
  }
  assert(startEvaluationHookSource.includes("apiRoutes.listEvaluationDatasets()"), "useEvaluationDatasets hook must use listEvaluationDatasets route helper");
  assert(startEvaluationHookSource.includes("apiGetOperation(\"listEvaluationDatasets\""), "useEvaluationDatasets hook must use generated dataset operation helper");
  assert(startEvaluationHookSource.includes("apiRoutes.listLlmModels()"), "useLlmModels hook must use listLlmModels route helper");
  assert(startEvaluationHookSource.includes("apiGetOperation(\"listLlmModels\""), "useLlmModels hook must use generated model operation helper");
  assert(startEvaluationHookSource.includes("apiRoutes.startEvaluationRun()"), "useStartEvaluationRun hook must use startEvaluationRun route helper");
  assert(startEvaluationHookSource.includes("apiPostOperation(\"startEvaluationRun\""), "useStartEvaluationRun hook must use generated evaluation operation helper");
  assert(startEvaluationHookSource.includes("model_id: input.modelId"), "useStartEvaluationRun hook must send selected model_id");
  assert(startEvaluationHookSource.includes("apiRoutes.getEvaluationRun(evaluationRunId ?? \"\")"), "useEvaluationRun hook must use getEvaluationRun route helper");
  assert(startEvaluationHookSource.includes("apiGetOperation(\"getEvaluationRun\""), "useEvaluationRun hook must use generated evaluation run operation helper");
  assert(startEvaluationHookSource.includes("items: response.items satisfies EvaluationRunItem[]"), "useEvaluationRun hook must expose evaluation run items");
  assert(apiClientSource.includes("/api/admin/evaluation-datasets"), "API client evaluation dataset helper must call /api/admin/evaluation-datasets");
  assert(apiClientSource.includes("/api/admin/evaluation-runs"), "API client evaluation run helper must call /api/admin/evaluation-runs");
  for (const token of [
    "DataTable",
    "文書はありません",
    "document.title",
    "StatusBadge"
  ]) {
    assert(documentTableSource.includes(token), `DocumentTable missing token: ${token}`);
  }
  for (const token of [
    "useForm",
    "zodResolver",
    "ingestionJobLookupSchema",
    "取り込みジョブ確認フォーム",
    "StatusBadge",
    "job.progress_percent",
    "進捗",
    "disabled={!props.csrfToken || !job?.retryable || retry.isPending}",
    "role=\"alert\""
  ]) {
    assert(ingestionJobPanelSource.includes(token), `IngestionJobPanel missing token: ${token}`);
  }
  for (const token of [
    "useForm",
    "zodResolver",
    "userImportSchema",
    "ユーザー取込フォーム",
    "CSV/Excel実アップロード: 未接続",
    "DataTable",
    "role=\"alert\"",
    "disabled={!props.csrfToken || startImport.isPending}"
  ]) {
    assert(userImportPanelSource.includes(token), `UserImportPanel missing token: ${token}`);
  }
  for (const token of [
    "DataTable",
    "ユーザーはありません",
    "user.email",
    "StatusBadge"
  ]) {
    assert(userTableSource.includes(token), `UserTable missing token: ${token}`);
  }
  for (const token of [
    "DataTable",
    "Drawer",
    "成果物はありません",
    "href={artifact.viewer_path}",
    "{artifact.title}"
  ]) {
    assert(artifactTableSource.includes(token), `ArtifactTable missing token: ${token}`);
  }
  assert(!adminActionsSource.includes("dataset-local-golden"), "Admin UI must not hard-code dataset ids");
  assert(!/useState<Artifact\[\]>\(\[[^\]]/.test(adminPageSource), "AdminApp must not seed fake artifacts");
  assert(!/useState<AdminDocument\[\]>\(\[[^\]]/.test(adminPageSource), "AdminApp must not seed fake documents");
});

scenario("admin local API flow", () => {
  const csrf = api.request("admin-1", "getMe").body.csrf_token;
  assert(api.request("user-owner", "adminListUsers").status === 403, "general user must not list admin users");
  const usersBefore = api.request("admin-1", "adminListUsers");
  assert(usersBefore.status === 200 && usersBefore.body.users.length >= 2, "admin users list failed");
  const userImport = api.request("admin-1", "startUserImport", {
    csrf_token: csrf,
    rows: [
      { action: "create", email: "flow-import@example.com", display_name: "flow import" },
      { action: "create", display_name: "missing email" }
    ]
  });
  assert(userImport.status === 202, "admin user import failed");
  const userImportResult = api.request("admin-1", "getUserImport", { import_id: userImport.body.import.import_id });
  assert(userImportResult.status === 200, "admin user import result failed");
  assert(userImportResult.body.import.result_report_json.created === 1, "admin user import created count mismatch");
  assert(userImportResult.body.import.result_report_json.failed === 1, "admin user import failed count mismatch");
  assert(userImportResult.body.rows.some((row) => row.error_message === "email is required"), "admin user import row error missing");
  assert(api.request("user-owner", "startUserImport", { csrf_token: "csrf-user-owner", rows: [] }).status === 403, "general user must not start user import");
  assert(api.request("user-owner", "getUserImport", { import_id: userImport.body.import.import_id }).status === 403, "general user must not get user import");
  assert(api.request("user-owner", "listPublishedArtifacts").status === 403, "general user must not list admin artifacts");
  assert(api.request("user-owner", "adminListDocuments").status === 403, "general user must not list admin documents");
  const artifacts = api.request("admin-1", "listPublishedArtifacts");
  assert(artifacts.status === 200, "admin artifacts list failed");
  assert(artifacts.body.artifacts.length >= 3, "admin artifacts missing");
  const emptyDocuments = api.request("admin-1", "adminListDocuments");
  assert(emptyDocuments.status === 200, "admin documents list failed");
  assert(Array.isArray(emptyDocuments.body.documents), "admin documents list must return documents array");
  const registered = api.request("admin-1", "createDocument", { csrf_token: csrf, title: "form document", file_name: "flow-form.pdf", acl_scope_id: "group:admin" });
  assert(registered.status === 202, "admin document registration failed");
  assert(registered.body.raw_s3_uri.endsWith("/flow-form.pdf"), "admin document registration must preserve file name in raw S3 URI");
  assert(api.request("user-owner", "getDocument", { document_id: registered.body.document_id }).status === 403, "general user must not get admin document detail");
  const registeredDetail = api.request("admin-1", "getDocument", { document_id: registered.body.document_id });
  assert(registeredDetail.status === 200, "admin document detail failed");
  assert(registeredDetail.body.document.versions.length === 1, "admin document detail must include versions");
  assert(registeredDetail.body.document.ingestion_jobs.length === 1, "admin document detail must include ingestion jobs");
  assert(registeredDetail.body.document.acl_entries.some((entry) => entry.acl_scope_id === "group:admin"), "admin document detail must include ACL entries");
  const documentsBeforeSuspension = api.request("admin-1", "adminListDocuments");
  assert(documentsBeforeSuspension.body.documents.some((document) => document.document_id === registered.body.document_id), "registered document missing from admin documents list before suspension");
  const notReadyActivation = api.request("admin-1", "activateDocumentVersion", { csrf_token: csrf, document_id: registered.body.document_id, version_id: registered.body.version_id });
  assert(notReadyActivation.status === 403, "queued document version must not activate");
  const completedVersion = api.request("admin-1", "createDocumentVersion", {
    csrf_token: csrf,
    document_id: registered.body.document_id,
    version_id: "ver-flow-complete",
    version_label: "completed",
    file_name: "flow-complete.pdf",
    acl_scope_id: "group:admin",
    metadata: { document_id: registered.body.document_id, version: "ver-flow-complete", acl_scope: "group:admin", status: "succeeded" }
  });
  assert(completedVersion.status === 202, "admin document version creation failed");
  assert(api.request("user-owner", "createDocumentVersion", { csrf_token: "csrf-user-owner", document_id: registered.body.document_id, file_name: "blocked.pdf" }).status === 403, "general user must not create document versions");
  assert(api.request("user-owner", "activateDocumentVersion", { csrf_token: "csrf-user-owner", document_id: registered.body.document_id, version_id: "ver-flow-complete" }).status === 403, "general user must not activate document versions");
  const activatedVersion = api.request("admin-1", "activateDocumentVersion", { csrf_token: csrf, document_id: registered.body.document_id, version_id: "ver-flow-complete" });
  assert(activatedVersion.status === 200 && activatedVersion.body.version.status === "active", "completed document version must activate");
  assert(api.request("user-owner", "updateDocumentAcl", { csrf_token: "csrf-user-owner", document_id: registered.body.document_id, version_id: "ver-flow-complete", acl_scope_id: "group:block" }).status === 403, "general user must not update document ACL");
  const aclUpdated = api.request("admin-1", "updateDocumentAcl", { csrf_token: csrf, document_id: registered.body.document_id, version_id: "ver-flow-complete", acl_scope_id: "group:legal" });
  assert(aclUpdated.status === 200, "admin document ACL update failed");
  assert(aclUpdated.body.document.acl_entries.some((entry) => entry.version_id === "ver-flow-complete" && entry.acl_scope_id === "group:legal"), "updated ACL scope missing from document detail");
  assert(!aclUpdated.body.document.acl_entries.some((entry) => entry.version_id === "ver-flow-complete" && entry.acl_scope_id === "group:admin"), "old ACL scope must be replaced for updated version");
  assert(api.request("user-owner", "suspendDocument", { csrf_token: "csrf-user-owner", document_id: registered.body.document_id }).status === 403, "general user must not suspend documents");
  const suspended = api.request("admin-1", "suspendDocument", { csrf_token: csrf, document_id: registered.body.document_id });
  assert(suspended.status === 200 && suspended.body.document.status === "deleted", "admin document suspension failed");
  assert(suspended.body.document.versions.every((version) => version.status === "deleted"), "document suspension must mark versions deleted");
  const documentsAfterSuspension = api.request("admin-1", "adminListDocuments");
  assert(!documentsAfterSuspension.body.documents.some((document) => document.document_id === registered.body.document_id), "suspended document must leave admin active document list");
  const invalid = api.request("admin-1", "createDocument", { csrf_token: csrf, title: "invalid metadata", document_id: "doc-invalid-flow", version_id: "ver-invalid-flow", metadata: { document_id: "doc-invalid-flow" } });
  const failedJob = api.request("admin-1", "getIngestionJob", { job_id: invalid.body.job_id });
  assert(failedJob.status === 200, "admin ingestion job fetch failed");
  assert(failedJob.body.job.status === "failed" && failedJob.body.job.retryable === true, "failed ingestion job must expose retryable state");
  assert(failedJob.body.job.progress_percent === 0, "failed ingestion job must expose 0 percent progress");
  assert(api.request("user-owner", "getIngestionJob", { job_id: invalid.body.job_id }).status === 403, "general user must not fetch ingestion jobs");
  assert(api.request("user-owner", "retryIngestionJob", { csrf_token: "csrf-user-owner", job_id: invalid.body.job_id }).status === 403, "general user must not retry ingestion jobs");
  const retried = api.request("admin-1", "retryIngestionJob", { csrf_token: csrf, job_id: invalid.body.job_id });
  assert(retried.status === 202 && retried.body.job.status === "queued", "admin ingestion retry failed");
  assert(retried.body.job.progress_percent === 10, "retried queued ingestion job must expose 10 percent progress");
  const completedJob = api.request("admin-1", "createDocument", {
    csrf_token: csrf,
    title: "complete flow document",
    document_id: "doc-flow-complete-progress",
    version_id: "ver-flow-complete-progress",
    metadata: { document_id: "doc-flow-complete-progress", version: "ver-flow-complete-progress", acl_scope: "admin", status: "succeeded" }
  });
  const fetchedCompletedJob = api.request("admin-1", "getIngestionJob", { job_id: completedJob.body.job_id });
  assert(fetchedCompletedJob.body.job.progress_percent === 100, "succeeded ingestion job must expose 100 percent progress");
  api.request("admin-1", "createDocument", { csrf_token: csrf, title: "flow document", document_id: "doc-flow", version_id: "ver-flow" });
  const documents = api.request("admin-1", "adminListDocuments");
  assert(documents.body.documents.some((document) => document.document_id === "doc-flow"), "created document missing from admin documents list");
  const datasets = api.request("admin-1", "listEvaluationDatasets");
  assert(datasets.status === 200 && datasets.body.datasets.some((dataset) => dataset.dataset_id === "dataset-local-golden"), "admin evaluation dataset list failed");
  assert(api.request("user-owner", "listEvaluationDatasets").status === 403, "general user must not list evaluation datasets");
  const models = api.request("admin-1", "listLlmModels");
  assert(models.status === 200 && models.body.models.some((model) => model.model_id === "logical-chat-default"), "admin model list must include general chat model");
  assert(models.body.models.some((model) => model.model_id === "logical-evaluation-judge"), "admin model list must include evaluation judge");
  assert(!models.body.models.some((model) => model.model_id === "logical-embedding-default"), "admin model list must not expose system embedding model");
  const userModels = api.request("user-owner", "listLlmModels");
  assert(userModels.status === 200, "general user must list available models");
  assert(userModels.body.models.some((model) => model.model_id === "logical-chat-default"), "general user model list must include visible chat model");
  assert(!userModels.body.models.some((model) => model.model_id === "logical-evaluation-judge"), "general user model list must not expose admin judge model");
  assert(!userModels.body.models.some((model) => model.model_id === "logical-embedding-default"), "general user model list must not expose system embedding model");
  assert(api.request("user-owner", "startEvaluationRun", { csrf_token: "csrf-user-owner", dataset_id: "dataset-local-golden", model_id: "logical-evaluation-judge" }).status === 403, "general user must not start evaluation runs");
  assert(api.request("admin-1", "startEvaluationRun", { csrf_token: csrf, dataset_id: "dataset-local-golden", model_id: "unknown-model" }).status === 403, "admin evaluation run must reject unknown model ids");
  assert(api.request("admin-1", "startEvaluationRun", { csrf_token: csrf, dataset_id: "dataset-local-golden", model_id: "logical-embedding-default" }).status === 403, "admin evaluation run must reject system embedding model");
  const defaultEvaluation = api.request("admin-1", "startEvaluationRun", { csrf_token: csrf, dataset_id: "dataset-local-golden" });
  assert(defaultEvaluation.status === 202 && defaultEvaluation.body.evaluation_run.model_id === "logical-chat-default", "evaluation run must resolve default model");
  const evaluation = api.request("admin-1", "startEvaluationRun", { csrf_token: csrf, dataset_id: "dataset-local-golden", model_id: "logical-evaluation-judge" });
  assert(evaluation.status === 202, "evaluation run failed");
  assert(evaluation.body.evaluation_run.model_id === "logical-evaluation-judge", "evaluation run must preserve selected model_id");
  const evaluationDetail = api.request("admin-1", "getEvaluationRun", { evaluation_run_id: evaluation.body.evaluation_run.evaluation_run_id });
  assert(evaluationDetail.status === 200 && evaluationDetail.body.evaluation_run.metrics_json.retrieval.recall_at_10 === 0.86, "admin evaluation run detail failed");
  assert(evaluationDetail.body.evaluation_run.model_id === "logical-evaluation-judge", "evaluation run detail must expose selected model_id");
  assert(evaluationDetail.body.items.length >= 2, "admin evaluation run items missing");
  assert(evaluationDetail.body.items.every((item) => item.evaluation_run_id === evaluation.body.evaluation_run.evaluation_run_id), "evaluation run items must belong to requested run");
  assert(evaluationDetail.body.items.some((item) => item.metrics_json.retrieval || item.metrics_json.end_to_end), "evaluation run item metrics missing");
  assert(api.request("user-owner", "getEvaluationRun", { evaluation_run_id: evaluation.body.evaluation_run.evaluation_run_id }).status === 403, "general user must not fetch evaluation run details");
  const cookie = api.request("admin-1", "issueArtifactAccessCookie", { csrf_token: csrf });
  assert(cookie.status === 201, "artifact cookie failed");
});

const report = {
  schema_version: "web-flow-local.v1",
  generated_by: "tools/check-web-flows.js",
  scenarios,
  passed: scenarios.filter((item) => item.status === "passed").length,
  failed: scenarios.filter((item) => item.status === "failed").length,
  note: "Node/local API/source gate によるローカル flow 検査。実ブラウザ/CloudFront E2E の証跡ではない。"
};
write("dist/reports/web-flow-local.json", `${JSON.stringify(report, null, 2)}\n`);
assert(report.failed === 0, "web flow scenarios failed");
console.log(`web flow check passed (${report.passed}/${scenarios.length} scenarios)`);

function scenario(name, fn) {
  const started = performance.now();
  try {
    fn();
    scenarios.push({ name, status: "passed", duration_ms: Number((performance.now() - started).toFixed(3)) });
  } catch (error) {
    scenarios.push({ name, status: "failed", duration_ms: Number((performance.now() - started).toFixed(3)), error: error.message });
  }
}

function write(path, body) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
