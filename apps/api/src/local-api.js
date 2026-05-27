import { createErrorResponse } from "../../../packages/domain/src/index.js";
import { createLocalStore } from "../../../packages/domain/src/store.js";
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
          case "addChatParticipant":
            return created({ participant: store.addParticipant(actor, input.chat_id, input) });
          case "updateChatParticipant":
            return ok({ participant: store.updateParticipant(actor, input.chat_id, input.user_id, input) });
          case "removeChatParticipant":
            store.removeParticipant(actor, input.chat_id, input.user_id);
            return noContent();
          case "submitQuestion":
            return accepted(store.submitQuestion(actor, input.chat_id, input, rag));
          case "listMessageEvents":
            return ok({ events: store.listEvents(actor, input.chat_id, input.message_id, input.after_seq || 0) });
          case "addFavorite":
            return created({ favorite: store.addFavorite(actor, input) });
          case "listFavorites":
            return ok({ favorites: store.listFavorites(actor) });
          case "listLlmModels":
            return ok({ models: store.listLlmModels() });
          case "adminListUsers":
            requireAdmin(actor);
            return ok({ users: store.state.users });
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
          case "createDocumentVersion":
            return accepted(store.createDocumentVersion(actor, input.document_id, input));
          case "activateDocumentVersion":
            return ok({ version: store.activateDocumentVersion(actor, input.document_id, input.version_id) });
          case "getIngestionJob":
            requireAdmin(actor);
            return ok({ job: store.state.ingestion_jobs.find((item) => item.job_id === input.job_id) });
          case "retryIngestionJob":
            requireAdmin(actor);
            return accepted({ job_id: input.job_id, status: "queued" });
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
            requireAdmin(actor);
            return created({ cookie_issued: true, expires_in_seconds: 300 });
          case "issueWsTicket":
            return created({ ticket: `ticket-${actor.user_id}`, expires_in_seconds: 60, channels: [`/users/${actor.user_id}/chat/*`] });
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
