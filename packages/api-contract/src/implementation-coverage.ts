import type { ApiOperationId } from "./routes";

export type ApiImplementationCoverageStatus = "implemented" | "aggregate" | "external" | "async_boundary" | "planned" | "not_required" | "present";

export interface ApiImplementationCoverage {
  route: ApiImplementationCoverageStatus;
  schema: ApiImplementationCoverageStatus;
  usecase: ApiImplementationCoverageStatus;
  localFixture: ApiImplementationCoverageStatus;
  production: ApiImplementationCoverageStatus;
  repository: ApiImplementationCoverageStatus;
  domainEvent: ApiImplementationCoverageStatus;
  audit: ApiImplementationCoverageStatus;
  openApi: "implemented";
  unitTest: ApiImplementationCoverageStatus;
  localIntegrationTest: ApiImplementationCoverageStatus;
  dsqlSmoke: ApiImplementationCoverageStatus;
  explicitPlannedMarker: "present" | "not_required";
  externalReason?: "cognito_redirect" | "cognito_callback" | "cookie_clear" | "handled_by_worker";
}

interface ApiCoverageOverrides {
  repository?: ApiImplementationCoverageStatus;
  domainEvent?: ApiImplementationCoverageStatus;
  audit?: ApiImplementationCoverageStatus;
  unitTest?: ApiImplementationCoverageStatus;
  localIntegrationTest?: ApiImplementationCoverageStatus;
  dsqlSmoke?: ApiImplementationCoverageStatus;
  externalReason?: ApiImplementationCoverage["externalReason"];
}

export const apiImplementationCoverage = {
  loginStart: api("aggregate", "aggregate", "aggregate", "implemented", "external", { repository: "not_required", unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "not_required", externalReason: "cognito_redirect" }),
  authCallback: api("aggregate", "aggregate", "aggregate", "implemented", "external", { repository: "implemented", domainEvent: "implemented", unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate", externalReason: "cognito_callback" }),
  logout: api("aggregate", "aggregate", "aggregate", "implemented", "implemented", { repository: "implemented", domainEvent: "implemented", unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  getMe: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  listChatSessions: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  createChatSession: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { domainEvent: "implemented", audit: "implemented", unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  getChatSession: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  updateChatSession: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { domainEvent: "implemented", audit: "implemented", unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  deleteChatSession: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { domainEvent: "implemented", audit: "implemented", unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  listChatParticipants: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  addChatParticipant: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { domainEvent: "implemented", audit: "implemented", unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  updateChatParticipant: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { domainEvent: "implemented", audit: "implemented", unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  removeChatParticipant: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { domainEvent: "implemented", audit: "implemented", unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  listMessages: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  submitQuestion: api("aggregate", "aggregate", "aggregate", "aggregate", "planned", { domainEvent: "planned" }),
  listMessageEvents: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  cancelAnswerGeneration: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { domainEvent: "planned" }),
  createFeedback: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { domainEvent: "planned" }),
  listFavorites: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  addFavorite: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { domainEvent: "planned" }),
  deleteFavorite: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { domainEvent: "planned" }),
  issueWsTicket: api("aggregate", "aggregate", "aggregate", "aggregate", "planned"),
  listLlmModels: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { unitTest: "aggregate", dsqlSmoke: "aggregate" }),
  adminListUsers: api("aggregate", "aggregate", "aggregate", "aggregate", "planned", { audit: "planned" }),
  startUserImport: api("aggregate", "aggregate", "aggregate", "aggregate", "planned", { domainEvent: "planned", audit: "planned" }),
  getUserImport: api("aggregate", "aggregate", "aggregate", "aggregate", "planned"),
  adminListDocuments: api("aggregate", "aggregate", "aggregate", "aggregate", "planned", { audit: "planned" }),
  createDocument: api("aggregate", "aggregate", "aggregate", "aggregate", "planned", { domainEvent: "planned", audit: "planned" }),
  getDocument: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  createDocumentVersion: api("aggregate", "aggregate", "aggregate", "aggregate", "planned", { domainEvent: "planned", audit: "planned" }),
  activateDocumentVersion: api("aggregate", "aggregate", "aggregate", "aggregate", "planned", { domainEvent: "planned", audit: "planned" }),
  updateDocumentAcl: api("aggregate", "aggregate", "aggregate", "aggregate", "planned", { domainEvent: "planned", audit: "planned" }),
  suspendDocument: api("aggregate", "aggregate", "aggregate", "aggregate", "planned", { domainEvent: "planned", audit: "planned" }),
  getIngestionJob: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  retryIngestionJob: api("aggregate", "aggregate", "aggregate", "aggregate", "planned", { domainEvent: "planned", audit: "planned" }),
  listEvaluationDatasets: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  startEvaluationRun: api("aggregate", "aggregate", "aggregate", "aggregate", "planned", { domainEvent: "planned", audit: "planned" }),
  getEvaluationRun: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  listPublishedArtifacts: api("aggregate", "aggregate", "aggregate", "aggregate", "implemented", { unitTest: "aggregate", localIntegrationTest: "implemented", dsqlSmoke: "aggregate" }),
  issueArtifactAccessCookie: api("aggregate", "aggregate", "aggregate", "aggregate", "planned", { audit: "planned" })
} satisfies Record<ApiOperationId, ApiImplementationCoverage>;

function api(
  route: ApiImplementationCoverageStatus,
  schema: ApiImplementationCoverageStatus,
  usecase: ApiImplementationCoverageStatus,
  localFixture: ApiImplementationCoverageStatus,
  production: ApiImplementationCoverageStatus,
  overrides: ApiCoverageOverrides = {}
): ApiImplementationCoverage {
  const unitTest = overrides.unitTest ?? "planned";
  const localIntegrationTest = overrides.localIntegrationTest ?? (localFixture === "planned" ? "planned" : "implemented");
  const dsqlSmoke = overrides.dsqlSmoke ?? (production === "implemented" ? "planned" : "not_required");
  return {
    route,
    schema,
    usecase,
    localFixture,
    production,
    repository: overrides.repository ?? production,
    domainEvent: overrides.domainEvent ?? "not_required",
    audit: overrides.audit ?? "not_required",
    openApi: "implemented",
    unitTest,
    localIntegrationTest,
    dsqlSmoke,
    explicitPlannedMarker: hasPlanned([
      route,
      schema,
      usecase,
      localFixture,
      production,
      overrides.repository,
      overrides.domainEvent,
      overrides.audit,
      unitTest,
      localIntegrationTest,
      dsqlSmoke
    ])
      ? "present"
      : "not_required",
    ...(overrides.externalReason ? { externalReason: overrides.externalReason } : {})
  };
}

function hasPlanned(values: Array<ApiImplementationCoverageStatus | undefined>) {
  return values.includes("planned");
}
