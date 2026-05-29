export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";
export type ApiRole = "general_user" | "admin";
export type ApiContentType = "application/json";

export interface ErrorResponseSchemaDefinition {
  name: "ErrorResponse";
  required: ["trace_id", "error_code", "message", "details"];
  properties: {
    trace_id: "string";
    error_code: "string";
    message: "string";
    details: "object";
  };
}

export interface PublicApiRoute {
  id: `API-${number}`;
  operationId: string;
  method: HttpMethod;
  viewerPath: `/api/${string}` | `/auth/${string}`;
  internalPath: `/v1/${string}`;
  roles: ApiRole[];
  csrfRequired: boolean;
  requestContentTypes: ApiContentType[];
  responseContentTypes: ApiContentType[];
  successStatuses: number[];
  errorSchema: "ErrorResponse";
}

export const apiRouteIds = [
  "API-1", "API-2", "API-3", "API-4", "API-5", "API-6", "API-7", "API-8", "API-9", "API-10",
  "API-11", "API-12", "API-13", "API-14", "API-15", "API-16", "API-17", "API-18", "API-19", "API-20",
  "API-21", "API-22", "API-23", "API-24", "API-25", "API-26", "API-27", "API-28", "API-29", "API-30",
  "API-31", "API-32", "API-33", "API-34", "API-35", "API-36", "API-37", "API-38"
] as const;

export type ApiRouteId = (typeof apiRouteIds)[number];

export const apiOperationIds = [
  "loginStart",
  "authCallback",
  "logout",
  "getMe",
  "listChatSessions",
  "createChatSession",
  "getChatSession",
  "updateChatSession",
  "deleteChatSession",
  "listChatParticipants",
  "addChatParticipant",
  "updateChatParticipant",
  "removeChatParticipant",
  "listMessages",
  "submitQuestion",
  "listMessageEvents",
  "cancelAnswerGeneration",
  "createFeedback",
  "listFavorites",
  "addFavorite",
  "deleteFavorite",
  "issueWsTicket",
  "listLlmModels",
  "adminListUsers",
  "startUserImport",
  "getUserImport",
  "adminListDocuments",
  "createDocument",
  "getDocument",
  "createDocumentVersion",
  "activateDocumentVersion",
  "getIngestionJob",
  "retryIngestionJob",
  "listEvaluationDatasets",
  "startEvaluationRun",
  "getEvaluationRun",
  "listPublishedArtifacts",
  "issueArtifactAccessCookie"
] as const;

export type ApiOperationId = (typeof apiOperationIds)[number];
