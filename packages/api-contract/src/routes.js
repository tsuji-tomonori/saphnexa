export const errorResponseSchema = {
  name: "ErrorResponse",
  required: ["trace_id", "error_code", "message", "details"],
  properties: {
    trace_id: "string",
    error_code: "string",
    message: "string",
    details: "object"
  }
};

const json = ["application/json"];
const csrf = true;

export const publicApiRoutes = [
  route("API-1", "loginStart", "GET", "/auth/login", "/v1/auth/login", ["general_user", "admin"], false, [302]),
  route("API-2", "authCallback", "GET", "/auth/callback", "/v1/auth/callback", ["general_user", "admin"], false, [302, 400]),
  route("API-3", "logout", "POST", "/auth/logout", "/v1/auth/logout", ["general_user", "admin"], csrf, [204]),
  route("API-4", "getMe", "GET", "/api/me", "/v1/me", ["general_user", "admin"], false, [200]),
  route("API-5", "listChatSessions", "GET", "/api/chat-sessions", "/v1/chat-sessions", ["general_user", "admin"], false, [200]),
  route("API-6", "createChatSession", "POST", "/api/chat-sessions", "/v1/chat-sessions", ["general_user", "admin"], csrf, [201]),
  route("API-7", "getChatSession", "GET", "/api/chat-sessions/{chat_id}", "/v1/chat-sessions/{chat_id}", ["general_user", "admin"], false, [200]),
  route("API-8", "updateChatSession", "PATCH", "/api/chat-sessions/{chat_id}", "/v1/chat-sessions/{chat_id}", ["general_user", "admin"], csrf, [200]),
  route("API-9", "deleteChatSession", "DELETE", "/api/chat-sessions/{chat_id}", "/v1/chat-sessions/{chat_id}", ["general_user", "admin"], csrf, [204]),
  route("API-10", "listChatParticipants", "GET", "/api/chat-sessions/{chat_id}/participants", "/v1/chat-sessions/{chat_id}/participants", ["general_user", "admin"], false, [200]),
  route("API-11", "addChatParticipant", "POST", "/api/chat-sessions/{chat_id}/participants", "/v1/chat-sessions/{chat_id}/participants", ["general_user", "admin"], csrf, [201]),
  route("API-12", "updateChatParticipant", "PATCH", "/api/chat-sessions/{chat_id}/participants/{user_id}", "/v1/chat-sessions/{chat_id}/participants/{user_id}", ["general_user", "admin"], csrf, [200]),
  route("API-13", "removeChatParticipant", "DELETE", "/api/chat-sessions/{chat_id}/participants/{user_id}", "/v1/chat-sessions/{chat_id}/participants/{user_id}", ["general_user", "admin"], csrf, [204]),
  route("API-14", "listMessages", "GET", "/api/chat-sessions/{chat_id}/messages", "/v1/chat-sessions/{chat_id}/messages", ["general_user", "admin"], false, [200]),
  route("API-15", "submitQuestion", "POST", "/api/chat-sessions/{chat_id}/messages", "/v1/chat-sessions/{chat_id}/messages", ["general_user", "admin"], csrf, [202]),
  route("API-16", "listMessageEvents", "GET", "/api/chat-sessions/{chat_id}/messages/{message_id}/events", "/v1/chat-sessions/{chat_id}/messages/{message_id}/events", ["general_user", "admin"], false, [200]),
  route("API-17", "cancelAnswerGeneration", "POST", "/api/chat-sessions/{chat_id}/messages/{message_id}/cancel", "/v1/chat-sessions/{chat_id}/messages/{message_id}/cancel", ["general_user", "admin"], csrf, [202]),
  route("API-18", "createFeedback", "POST", "/api/chat-sessions/{chat_id}/messages/{message_id}/feedback", "/v1/chat-sessions/{chat_id}/messages/{message_id}/feedback", ["general_user", "admin"], csrf, [201]),
  route("API-19", "listFavorites", "GET", "/api/favorites", "/v1/favorites", ["general_user", "admin"], false, [200]),
  route("API-20", "addFavorite", "POST", "/api/favorites", "/v1/favorites", ["general_user", "admin"], csrf, [201]),
  route("API-21", "deleteFavorite", "DELETE", "/api/favorites/{favorite_id}", "/v1/favorites/{favorite_id}", ["general_user", "admin"], csrf, [204]),
  route("API-22", "issueWsTicket", "POST", "/api/ws-ticket", "/v1/ws-ticket", ["general_user", "admin"], csrf, [201]),
  route("API-23", "listLlmModels", "GET", "/api/llm-models", "/v1/llm-models", ["general_user", "admin"], false, [200]),
  route("API-24", "adminListUsers", "GET", "/api/admin/users", "/v1/admin/users", ["admin"], false, [200]),
  route("API-25", "startUserImport", "POST", "/api/admin/user-imports", "/v1/admin/user-imports", ["admin"], csrf, [202]),
  route("API-26", "getUserImport", "GET", "/api/admin/user-imports/{import_id}", "/v1/admin/user-imports/{import_id}", ["admin"], false, [200]),
  route("API-27", "adminListDocuments", "GET", "/api/admin/documents", "/v1/admin/documents", ["admin"], false, [200]),
  route("API-28", "createDocument", "POST", "/api/admin/documents", "/v1/admin/documents", ["admin"], csrf, [202]),
  route("API-29", "getDocument", "GET", "/api/admin/documents/{document_id}", "/v1/admin/documents/{document_id}", ["admin"], false, [200]),
  route("API-30", "createDocumentVersion", "POST", "/api/admin/documents/{document_id}/versions", "/v1/admin/documents/{document_id}/versions", ["admin"], csrf, [202]),
  route("API-31", "activateDocumentVersion", "POST", "/api/admin/documents/{document_id}/versions/{version_id}/activate", "/v1/admin/documents/{document_id}/versions/{version_id}/activate", ["admin"], csrf, [200]),
  route("API-32", "suspendDocument", "POST", "/api/admin/documents/{document_id}/suspend", "/v1/admin/documents/{document_id}/suspend", ["admin"], csrf, [200]),
  route("API-33", "getIngestionJob", "GET", "/api/admin/ingestion-jobs/{job_id}", "/v1/admin/ingestion-jobs/{job_id}", ["admin"], false, [200]),
  route("API-34", "retryIngestionJob", "POST", "/api/admin/ingestion-jobs/{job_id}/retry", "/v1/admin/ingestion-jobs/{job_id}/retry", ["admin"], csrf, [202]),
  route("API-35", "listEvaluationDatasets", "GET", "/api/admin/evaluation-datasets", "/v1/admin/evaluation-datasets", ["admin"], false, [200]),
  route("API-36", "startEvaluationRun", "POST", "/api/admin/evaluation-runs", "/v1/admin/evaluation-runs", ["admin"], csrf, [202]),
  route("API-37", "getEvaluationRun", "GET", "/api/admin/evaluation-runs/{evaluation_run_id}", "/v1/admin/evaluation-runs/{evaluation_run_id}", ["admin"], false, [200]),
  route("API-38", "listPublishedArtifacts", "GET", "/api/admin/artifacts", "/v1/admin/artifacts", ["admin"], false, [200]),
  route("API-39", "issueArtifactAccessCookie", "POST", "/api/admin/artifacts/access-cookie", "/v1/admin/artifacts/access-cookie", ["admin"], csrf, [201])
];

export function route(id, operationId, method, viewerPath, internalPath, roles, csrfRequired, successStatuses) {
  return {
    id,
    operationId,
    method,
    viewerPath,
    internalPath,
    roles,
    csrfRequired,
    requestContentTypes: method === "GET" || method === "DELETE" ? [] : json,
    responseContentTypes: successStatuses.includes(204) || successStatuses.includes(302) ? [] : json,
    successStatuses,
    errorSchema: errorResponseSchema.name
  };
}

export function assertPublicApiContract() {
  const ids = new Set(publicApiRoutes.map((item) => item.id));
  const operationIds = new Set(publicApiRoutes.map((item) => item.operationId));
  if (publicApiRoutes.length !== 39) throw new Error(`expected 39 public routes, got ${publicApiRoutes.length}`);
  if (ids.size !== 39) throw new Error("public API IDs must be unique");
  if (operationIds.size !== 39) throw new Error("public API operationIds must be unique");
  for (const item of publicApiRoutes) {
    if (!item.viewerPath.startsWith("/api/") && !item.viewerPath.startsWith("/auth/")) {
      throw new Error(`${item.id} has invalid viewer path ${item.viewerPath}`);
    }
    if (!item.internalPath.startsWith("/v1/")) throw new Error(`${item.id} must map to /v1/*`);
    if (["POST", "PATCH", "DELETE"].includes(item.method) && item.id !== "API-21" && item.csrfRequired !== true) {
      throw new Error(`${item.id} state-changing route must require CSRF`);
    }
  }
  return true;
}
