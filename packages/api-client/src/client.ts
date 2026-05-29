import type {
  ApiClientGeneratedOperationId,
  ApiClientOperationRequest,
  ApiClientOperationResponse,
  ApiClientOperationTypes
} from "./generated/operation-types";

export type ApiClientPath = `/api/${string}` | `/auth/${string}`;
export type ApiClientPathTemplate = `/${"api" | "auth"}/${string}`;
export type {
  ApiClientErrorResponse,
  ApiClientGeneratedOperationId,
  ApiClientJsonObject,
  ApiClientOperationRequest,
  ApiClientOperationResponse,
  ApiClientOperationType,
  ApiClientOperationTypes
} from "./generated/operation-types";

export const apiRouteTemplates = {
  loginStart: "/auth/login",
  authCallback: "/auth/callback",
  logout: "/auth/logout",
  getMe: "/api/me",
  listChatSessions: "/api/chat-sessions",
  createChatSession: "/api/chat-sessions",
  getChatSession: "/api/chat-sessions/{chat_id}",
  updateChatSession: "/api/chat-sessions/{chat_id}",
  deleteChatSession: "/api/chat-sessions/{chat_id}",
  listChatParticipants: "/api/chat-sessions/{chat_id}/participants",
  addChatParticipant: "/api/chat-sessions/{chat_id}/participants",
  updateChatParticipant: "/api/chat-sessions/{chat_id}/participants/{user_id}",
  removeChatParticipant: "/api/chat-sessions/{chat_id}/participants/{user_id}",
  listMessages: "/api/chat-sessions/{chat_id}/messages",
  submitQuestion: "/api/chat-sessions/{chat_id}/messages",
  listMessageEvents: "/api/chat-sessions/{chat_id}/messages/{message_id}/events",
  cancelAnswerGeneration: "/api/chat-sessions/{chat_id}/messages/{message_id}/cancel",
  createFeedback: "/api/chat-sessions/{chat_id}/messages/{message_id}/feedback",
  listFavorites: "/api/favorites",
  addFavorite: "/api/favorites",
  deleteFavorite: "/api/favorites/{favorite_id}",
  issueWsTicket: "/api/ws-ticket",
  listLlmModels: "/api/llm-models",
  adminListUsers: "/api/admin/users",
  startUserImport: "/api/admin/user-imports",
  getUserImport: "/api/admin/user-imports/{import_id}",
  adminListDocuments: "/api/admin/documents",
  createDocument: "/api/admin/documents",
  getDocument: "/api/admin/documents/{document_id}",
  createDocumentVersion: "/api/admin/documents/{document_id}/versions",
  activateDocumentVersion: "/api/admin/documents/{document_id}/versions/{version_id}/activate",
  getIngestionJob: "/api/admin/ingestion-jobs/{job_id}",
  retryIngestionJob: "/api/admin/ingestion-jobs/{job_id}/retry",
  listEvaluationDatasets: "/api/admin/evaluation-datasets",
  startEvaluationRun: "/api/admin/evaluation-runs",
  getEvaluationRun: "/api/admin/evaluation-runs/{evaluation_run_id}",
  listPublishedArtifacts: "/api/admin/artifacts",
  issueArtifactAccessCookie: "/api/admin/artifacts/access-cookie"
} as const satisfies Record<string, ApiClientPathTemplate>;

export type ApiClientRouteName = keyof typeof apiRouteTemplates;
export type ApiClientOperationIdForMethod<TMethod extends ApiClientOperationTypes[ApiClientGeneratedOperationId]["method"]> = {
  [TOperation in ApiClientGeneratedOperationId]: ApiClientOperationTypes[TOperation]["method"] extends TMethod
    ? TOperation
    : never;
}[ApiClientGeneratedOperationId];
export type ApiClientRequestBodyInput<TOperation extends ApiClientGeneratedOperationId> =
  ApiClientOperationRequest<TOperation> extends never
    ? never
    : Omit<ApiClientOperationRequest<TOperation>, "csrf_token">;

export const apiRoutes = {
  loginStart: () => pathFromTemplate(apiRouteTemplates.loginStart),
  authCallback: () => pathFromTemplate(apiRouteTemplates.authCallback),
  logout: () => pathFromTemplate(apiRouteTemplates.logout),
  getMe: () => pathFromTemplate(apiRouteTemplates.getMe),
  listChatSessions: () => pathFromTemplate(apiRouteTemplates.listChatSessions),
  createChatSession: () => pathFromTemplate(apiRouteTemplates.createChatSession),
  getChatSession: (chatId: string) => pathFromTemplate(apiRouteTemplates.getChatSession, { chat_id: chatId }),
  updateChatSession: (chatId: string) => pathFromTemplate(apiRouteTemplates.updateChatSession, { chat_id: chatId }),
  deleteChatSession: (chatId: string) => pathFromTemplate(apiRouteTemplates.deleteChatSession, { chat_id: chatId }),
  listChatParticipants: (chatId: string) =>
    pathFromTemplate(apiRouteTemplates.listChatParticipants, { chat_id: chatId }),
  addChatParticipant: (chatId: string) => pathFromTemplate(apiRouteTemplates.addChatParticipant, { chat_id: chatId }),
  updateChatParticipant: (chatId: string, userId: string) =>
    pathFromTemplate(apiRouteTemplates.updateChatParticipant, { chat_id: chatId, user_id: userId }),
  removeChatParticipant: (chatId: string, userId: string) =>
    pathFromTemplate(apiRouteTemplates.removeChatParticipant, { chat_id: chatId, user_id: userId }),
  listMessages: (chatId: string) => pathFromTemplate(apiRouteTemplates.listMessages, { chat_id: chatId }),
  submitQuestion: (chatId: string) => pathFromTemplate(apiRouteTemplates.submitQuestion, { chat_id: chatId }),
  listMessageEvents: (chatId: string, messageId: string) =>
    pathFromTemplate(apiRouteTemplates.listMessageEvents, { chat_id: chatId, message_id: messageId }),
  cancelAnswerGeneration: (chatId: string, messageId: string) =>
    pathFromTemplate(apiRouteTemplates.cancelAnswerGeneration, { chat_id: chatId, message_id: messageId }),
  createFeedback: (chatId: string, messageId: string) =>
    pathFromTemplate(apiRouteTemplates.createFeedback, { chat_id: chatId, message_id: messageId }),
  listFavorites: () => pathFromTemplate(apiRouteTemplates.listFavorites),
  addFavorite: () => pathFromTemplate(apiRouteTemplates.addFavorite),
  deleteFavorite: (favoriteId: string) => pathFromTemplate(apiRouteTemplates.deleteFavorite, { favorite_id: favoriteId }),
  issueWsTicket: () => pathFromTemplate(apiRouteTemplates.issueWsTicket),
  listLlmModels: () => pathFromTemplate(apiRouteTemplates.listLlmModels),
  adminListUsers: () => pathFromTemplate(apiRouteTemplates.adminListUsers),
  startUserImport: () => pathFromTemplate(apiRouteTemplates.startUserImport),
  getUserImport: (importId: string) => pathFromTemplate(apiRouteTemplates.getUserImport, { import_id: importId }),
  adminListDocuments: () => pathFromTemplate(apiRouteTemplates.adminListDocuments),
  createDocument: () => pathFromTemplate(apiRouteTemplates.createDocument),
  getDocument: (documentId: string) => pathFromTemplate(apiRouteTemplates.getDocument, { document_id: documentId }),
  createDocumentVersion: (documentId: string) =>
    pathFromTemplate(apiRouteTemplates.createDocumentVersion, { document_id: documentId }),
  activateDocumentVersion: (documentId: string, versionId: string) =>
    pathFromTemplate(apiRouteTemplates.activateDocumentVersion, { document_id: documentId, version_id: versionId }),
  getIngestionJob: (jobId: string) => pathFromTemplate(apiRouteTemplates.getIngestionJob, { job_id: jobId }),
  retryIngestionJob: (jobId: string) => pathFromTemplate(apiRouteTemplates.retryIngestionJob, { job_id: jobId }),
  listEvaluationDatasets: () => pathFromTemplate(apiRouteTemplates.listEvaluationDatasets),
  startEvaluationRun: () => pathFromTemplate(apiRouteTemplates.startEvaluationRun),
  getEvaluationRun: (evaluationRunId: string) =>
    pathFromTemplate(apiRouteTemplates.getEvaluationRun, { evaluation_run_id: evaluationRunId }),
  listPublishedArtifacts: () => pathFromTemplate(apiRouteTemplates.listPublishedArtifacts),
  issueArtifactAccessCookie: () => pathFromTemplate(apiRouteTemplates.issueArtifactAccessCookie)
} as const satisfies Record<ApiClientRouteName, (...args: string[]) => ApiClientPath>;

export async function apiGet<T>(path: ApiClientPath): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export async function apiGetOperation<TOperation extends ApiClientOperationIdForMethod<"GET">>(
  operationId: TOperation,
  path: ApiClientPath
): Promise<ApiClientOperationResponse<TOperation>> {
  void operationId;
  return request<ApiClientOperationResponse<TOperation>>(path, { method: "GET" });
}

export async function apiPost<T>(path: ApiClientPath, body: unknown, csrfToken: string): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
    body: JSON.stringify(body)
  });
}

export async function apiPostOperation<TOperation extends ApiClientOperationIdForMethod<"POST">>(
  operationId: TOperation,
  path: ApiClientPath,
  body: ApiClientRequestBodyInput<TOperation>,
  csrfToken: string
): Promise<ApiClientOperationResponse<TOperation>> {
  void operationId;
  return request<ApiClientOperationResponse<TOperation>>(path, {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
    body: JSON.stringify(body)
  });
}

export async function apiPatch<T>(path: ApiClientPath, body: unknown, csrfToken: string): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
    body: JSON.stringify(body)
  });
}

export async function apiPatchOperation<TOperation extends ApiClientOperationIdForMethod<"PATCH">>(
  operationId: TOperation,
  path: ApiClientPath,
  body: ApiClientRequestBodyInput<TOperation>,
  csrfToken: string
): Promise<ApiClientOperationResponse<TOperation>> {
  void operationId;
  return request<ApiClientOperationResponse<TOperation>>(path, {
    method: "PATCH",
    headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
    body: JSON.stringify(body)
  });
}

export async function apiDelete<T>(path: ApiClientPath, csrfToken?: string): Promise<T> {
  const init: RequestInit = { method: "DELETE" };
  if (csrfToken) {
    init.headers = { "x-csrf-token": csrfToken };
  }
  return request<T>(path, init);
}

export async function apiDeleteOperation<TOperation extends ApiClientOperationIdForMethod<"DELETE">>(
  operationId: TOperation,
  path: ApiClientPath,
  csrfToken?: string
): Promise<ApiClientOperationResponse<TOperation>> {
  void operationId;
  const init: RequestInit = { method: "DELETE" };
  if (csrfToken) {
    init.headers = { "x-csrf-token": csrfToken };
  }
  return request<ApiClientOperationResponse<TOperation>>(path, init);
}

function pathFromTemplate(template: ApiClientPathTemplate, params: Record<string, string> = {}): ApiClientPath {
  const path = Object.entries(params).reduce(
    (current, [key, value]) => current.replace(`{${key}}`, encodeURIComponent(value)),
    template as string
  );
  if (path.includes("{")) {
    throw new Error(`Missing API route parameter for ${template}`);
  }
  if (!path.startsWith("/api/") && !path.startsWith("/auth/")) {
    throw new Error(`Invalid API route template ${template}`);
  }
  return path as ApiClientPath;
}

async function request<T>(path: ApiClientPath, init: RequestInit): Promise<T> {
  if (!path.startsWith("/api/") && !path.startsWith("/auth/")) {
    throw new Error("Saphnexa web client only accepts relative /api or /auth paths.");
  }
  const response = await fetch(path, { credentials: "include", ...init });
  if (!response.ok) throw await response.json();
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
