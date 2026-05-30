import { createErrorResponse } from "../../../packages/domain/src/index";
import { createLocalStore } from "../../../packages/domain/src/store.js";
import { publicApiRoutes } from "../../../packages/api-contract/src/routes";
import { createFixtureRagAdapter, createLocalTools } from "../../../packages/rag-core/src/fixture-rag";

type LocalApiError = Error & { status?: number; error_code?: string };

export function createLocalApi() {
  const store = createLocalStore();
  const tools = createLocalTools(store.state);
  const rag = createFixtureRagAdapter(tools);

  return {
    store,
    request(actorId: string, operationId: string, input: Record<string, any> = {}) {
      const actor = store.getCurrentUser(actorId);
      try {
        enforceCsrf(actor, operationId, input);
        switch (operationId) {
          case "loginStart":
            return {
              status: 302,
              body: {
                redirect_url: `/auth/callback?code=local-auth-code&state=${encodeURIComponent(String(input.state ?? "local-state"))}`,
                state: input.state ?? "local-state"
              }
            };
          case "authCallback":
            return authCallback(store.state as any, input);
          case "logout":
            return logout(store.state as any, actor, input);
          case "getMe":
            if (!actor) {
              throw localApiError("認証が必要。", 401, "UNAUTHENTICATED");
            }
            return ok({ user: actor, csrf_token: `csrf-${actor?.user_id || "anonymous"}` });
          case "createChatSession":
            return created({ chat: store.createChat(actor, input) });
          case "listChatSessions":
            return ok({ chats: store.listChats(actor) });
          case "getChatSession":
            return ok({ chat: store.getChat(actor, input.chat_id) });
          case "updateChatSession":
            return ok({ chat: store.updateChat(actor, input.chat_id, input) });
          case "deleteChatSession":
            store.deleteChat(actor, input.chat_id);
            return noContent();
          case "listChatParticipants":
            return ok({ participants: store.listParticipants(actor, input.chat_id) });
          case "listMessages":
            return ok(store.listMessages(actor, input.chat_id, input));
          case "addChatParticipant":
            return created({ participant: store.addParticipant(actor, input.chat_id, input) });
          case "updateChatParticipant":
            return ok({ participant: store.updateParticipant(actor, input.chat_id, input.user_id, input) });
          case "removeChatParticipant":
            store.removeParticipant(actor, input.chat_id, input.user_id);
            return noContent();
          case "submitQuestion":
            return accepted(store.submitQuestion(actor, input.chat_id, input, rag));
          case "cancelAnswerGeneration":
            return accepted(store.cancelAnswerGeneration(actor, input.chat_id, input.message_id, input));
          case "listMessageEvents":
            return ok({ events: store.listEvents(actor, input.chat_id, input.message_id, input.after_seq || 0) });
          case "createFeedback":
            return created({ feedback: store.createFeedback(actor, input.chat_id, input.message_id, input) });
          case "addFavorite":
            return created({ favorite: store.addFavorite(actor, input) });
          case "deleteFavorite":
            store.deleteFavorite(actor, input.favorite_id);
            return noContent();
          case "listFavorites":
            return ok({ favorites: store.listFavorites(actor) });
          case "listLlmModels":
            return ok({ models: store.listLlmModels(actor) });
          case "adminListUsers":
            return ok({ users: store.listAdminUsers(actor) });
          case "startUserImport":
            return accepted({ import: store.startUserImport(actor, input.rows || []) });
          case "getUserImport":
            requireAdmin(actor);
            return ok({
              import: (store.state.user_import_jobs as any[]).find((item) => item.import_id === input.import_id),
              rows: (store.state.user_import_rows as any[]).filter((item) => item.import_id === input.import_id)
            });
          case "createDocument":
            return accepted(store.createDocument(actor, input));
          case "adminListDocuments":
            return ok({ documents: store.listDocuments(actor) });
          case "getDocument":
            return ok({ document: store.getDocument(actor, input.document_id) });
          case "createDocumentVersion":
            return accepted(store.createDocumentVersion(actor, input.document_id, input));
          case "activateDocumentVersion":
            return ok({ version: store.activateDocumentVersion(actor, input.document_id, input.version_id) });
          case "updateDocumentAcl":
            return ok({ document: store.updateDocumentAcl(actor, input.document_id, input.version_id, input) });
          case "suspendDocument":
            return ok({ document: store.suspendDocument(actor, input.document_id) });
          case "getIngestionJob":
            return ok({ job: store.getIngestionJob(actor, input.job_id) });
          case "retryIngestionJob":
            return accepted({ job: store.retryIngestionJob(actor, input.job_id) });
          case "listEvaluationDatasets":
            requireAdmin(actor);
            return ok({ datasets: store.state.evaluation_datasets });
          case "startEvaluationRun":
            return accepted({ evaluation_run: store.startEvaluationRun(actor, input) });
          case "getEvaluationRun":
            return ok(store.getEvaluationRun(actor, input.evaluation_run_id));
          case "listPublishedArtifacts":
            return ok({ artifacts: store.listAdminArtifacts(actor) });
          case "issueArtifactAccessCookie":
            return created(store.issueArtifactAccessCookie(actor));
          case "issueWsTicket":
            return created(store.issueWsTicket(actor, input));
          case "consumeWsTicket":
            return ok({ ticket: store.consumeWsTicket(actor, input.ticket_id, input.now_ms) });
          default:
            return { status: 501, body: createErrorResponse("NOT_IMPLEMENTED", `${operationId} is not implemented`, { operationId }) };
        }
      } catch (error) {
        const localError = error as LocalApiError;
        return {
          status: localError.status || 500,
          body: createErrorResponse(localError.error_code || "INTERNAL_ERROR", localError.message, { operationId })
        };
      }
    }
  };
}

function enforceCsrf(actor: any, operationId: string, input: Record<string, any>) {
  const route = publicApiRoutes.find((item) => item.operationId === operationId);
  if (!route?.csrfRequired) return;
  if (!actor) {
    throw localApiError("認証が必要。", 401, "UNAUTHENTICATED");
  }
  const expected = `csrf-${actor.user_id}`;
  if (input.csrf_token !== expected) {
    throw localApiError("CSRF token が不正。", 403, "CSRF_TOKEN_INVALID");
  }
}

function requireAdmin(actor: any) {
  if (!actor || actor.role !== "admin") {
    throw localApiError("管理者権限が必要。", actor ? 403 : 401, actor ? "ADMIN_REQUIRED" : "UNAUTHENTICATED");
  }
}

function authCallback(state: any, input: Record<string, any>) {
  if (!input.code) return { status: 400, body: createErrorResponse("AUTH_CODE_MISSING", "Authorization code is required") };
  const userId = String(input.user_id ?? "user-owner");
  const user = state.users.find((item: any) => item.user_id === userId && item.status === "active");
  if (!user) return { status: 400, body: createErrorResponse("AUTH_USER_NOT_FOUND", "Authenticated user was not found", { user_id: userId }) };
  const session = {
    tenant_id: user.tenant_id,
    session_id: `session-${user.user_id}`,
    user_id: user.user_id,
    refresh_token_ref: `local-refresh-${user.user_id}`,
    csrf_secret_hash: `local-csrf-${user.user_id}`,
    status: "active",
    expires_at: "2026-05-27T01:00:00.000Z",
    created_at: "2026-05-27T00:00:00.000Z",
    updated_at: "2026-05-27T00:00:00.000Z"
  };
  state.web_sessions = (state.web_sessions ?? []).filter((item: any) => item.session_id !== session.session_id);
  state.web_sessions.push(session);
  state.web_session_events = state.web_session_events ?? [];
  state.web_session_events.push({
    tenant_id: user.tenant_id,
    event_id: `event-${session.session_id}`,
    aggregate_id: session.session_id,
    aggregate_type: "web_session",
    event_seq: 1,
    event_name: "web_session.started",
    occurred_at: session.created_at,
    actor_user_id: user.user_id,
    correlation_id: input.state ?? null,
    causation_id: null,
    idempotency_key: `auth-callback-${input.code}`,
    payload_json: { user_id: user.user_id, session_id: session.session_id }
  });
  return { status: 302, body: { redirect_url: "/chat", session_id: session.session_id, csrf_token: `csrf-${user.user_id}` } };
}

function logout(state: any, actor: any, input: Record<string, any>) {
  if (!actor) throw localApiError("認証が必要。", 401, "UNAUTHENTICATED");
  const sessionId = String(input.session_id ?? `session-${actor.user_id}`);
  const sessions = state.web_sessions ?? [];
  const session = sessions.find((item: any) => item.session_id === sessionId && item.user_id === actor.user_id);
  if (session) {
    session.status = "revoked";
    session.updated_at = "2026-05-27T00:00:00.000Z";
  }
  state.web_session_events = state.web_session_events ?? [];
  state.web_session_events.push({
    tenant_id: actor.tenant_id,
    event_id: `event-${sessionId}-logout`,
    aggregate_id: sessionId,
    aggregate_type: "web_session",
    event_seq: state.web_session_events.filter((item: any) => item.aggregate_id === sessionId).length + 1,
    event_name: "web_session.logged_out",
    occurred_at: "2026-05-27T00:00:00.000Z",
    actor_user_id: actor.user_id,
    correlation_id: null,
    causation_id: null,
    idempotency_key: `logout-${sessionId}`,
    payload_json: { session_id: sessionId }
  });
  return noContent();
}

function localApiError(message: string, status: number, error_code: string): LocalApiError {
  const error = new Error(message) as LocalApiError;
  error.status = status;
  error.error_code = error_code;
  return error;
}

function ok(body: unknown) {
  return { status: 200, body };
}

function created(body: unknown) {
  return { status: 201, body };
}

function accepted(body: unknown) {
  return { status: 202, body };
}

function noContent() {
  return { status: 204, body: null };
}
