import { createErrorResponse } from "../../../packages/domain/src/index.js";
import { createLocalStore } from "../../../packages/domain/src/store.js";
import { publicApiRoutes } from "../../../packages/api-contract/src/routes.js";
import { createFixtureRagAdapter, createLocalTools } from "../../../packages/rag-core/src/fixture-rag.js";

export function createLocalApi() {
  const store = createLocalStore();
  const tools = createLocalTools(store.state);
  const rag = createFixtureRagAdapter(tools);

  return {
    store,
    request(actorId, operationId, input = {}) {
      const actor = store.getCurrentUser(actorId);
      try {
        enforceCsrf(actor, operationId, input);
        switch (operationId) {
          case "getMe":
            if (!actor) {
              const error = new Error("認証が必要。");
              error.status = 401;
              error.error_code = "UNAUTHENTICATED";
              throw error;
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
            return ok({ messages: store.listMessages(actor, input.chat_id) });
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
            return ok({ models: store.listLlmModels() });
          case "adminListUsers":
            return ok({ users: store.listAdminUsers(actor) });
          case "startUserImport":
            return accepted({ import: store.startUserImport(actor, input.rows || []) });
          case "getUserImport":
            requireAdmin(actor);
            return ok({
              import: store.state.user_import_jobs.find((item) => item.import_id === input.import_id),
              rows: store.state.user_import_rows.filter((item) => item.import_id === input.import_id)
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
            requireAdmin(actor);
            return ok({ evaluation_run: store.state.evaluation_runs.find((item) => item.evaluation_run_id === input.evaluation_run_id) });
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
        return {
          status: error.status || 500,
          body: createErrorResponse(error.error_code || "INTERNAL_ERROR", error.message, { operationId })
        };
      }
    }
  };
}

function enforceCsrf(actor, operationId, input) {
  const route = publicApiRoutes.find((item) => item.operationId === operationId);
  if (!route?.csrfRequired) return;
  if (!actor) {
    const error = new Error("認証が必要。");
    error.status = 401;
    error.error_code = "UNAUTHENTICATED";
    throw error;
  }
  const expected = `csrf-${actor.user_id}`;
  if (input.csrf_token !== expected) {
    const error = new Error("CSRF token が不正。");
    error.status = 403;
    error.error_code = "CSRF_TOKEN_INVALID";
    throw error;
  }
}

function requireAdmin(actor) {
  if (!actor || actor.role !== "admin") {
    const error = new Error("管理者権限が必要。");
    error.status = actor ? 403 : 401;
    error.error_code = actor ? "ADMIN_REQUIRED" : "UNAUTHENTICATED";
    throw error;
  }
}

function ok(body) {
  return { status: 200, body };
}

function created(body) {
  return { status: 201, body };
}

function accepted(body) {
  return { status: 202, body };
}

function noContent() {
  return { status: 204, body: null };
}
