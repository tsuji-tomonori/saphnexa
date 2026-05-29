import { z } from "@hono/zod-openapi";
import { buildHonoRouteDefinitions, type HonoRouteDefinition } from "./openapi-document";

export const emptyParamsSchema = z.object({}).openapi("EmptyParams");
export const emptyBodySchema = z.object({}).openapi("EmptyBody");

export const errorResponseSchema = z
  .object({
    trace_id: z.string(),
    error_code: z.string(),
    message: z.string(),
    details: z.record(z.unknown())
  })
  .openapi("ErrorResponse");

export function buildRouteZodSchemas() {
  return Object.fromEntries(buildHonoRouteDefinitions().map((route) => [route.operationId, zodSchemasForRoute(route)]));
}

function zodSchemasForRoute(route: HonoRouteDefinition) {
  return {
    params: route.pathParameters.length > 0 ? paramsSchema(route) : emptyParamsSchema,
    query: route.operationId === "listMessageEvents" ? z.object({ after_seq: numericString.optional() }) : z.object({}),
    headers: route.csrfRequired ? z.object({ "x-csrf-token": z.string().min(1) }) : z.object({}),
    body: route.requestContentTypes.length > 0 ? bodySchema(route) : emptyBodySchema,
    response: responseSchema(route)
  };
}

function paramsSchema(route: HonoRouteDefinition) {
  return z
    .object(Object.fromEntries(route.pathParameters.map((name) => [name, z.string().min(1)])))
    .openapi(route.zodSchemaNames.params);
}

function bodySchema(route: HonoRouteDefinition) {
  const common = {
    csrf_token: z.string().optional(),
    title: z.string().min(1).optional(),
    question: z.string().min(1).optional(),
    user_id: z.string().min(1).optional(),
    document_id: z.string().min(1).optional(),
    version_id: z.string().min(1).optional(),
    version_label: z.string().min(1).optional(),
    file_name: z.string().min(1).optional(),
    acl_scope_id: z.string().min(1).optional(),
    dataset_id: z.string().min(1).optional(),
    model_id: z.string().min(1).optional(),
    import_id: z.string().min(1).optional(),
    job_id: z.string().min(1).optional(),
    now_ms: z.number().int().optional(),
    rows: z.array(z.record(z.unknown())).optional(),
    metadata: z.record(z.unknown()).optional(),
    retrieval_policy: z
      .object({
        top_k: z.number().int().min(1).max(50).optional(),
        allowed_acl_scope_ids: z.array(z.string().min(1)).optional()
      })
      .optional()
  };
  return z.object(common).passthrough().openapi(route.zodSchemaNames.body);
}

function responseSchema(route: HonoRouteDefinition) {
  const schemas: Record<string, ReturnType<typeof z.object>> = {
    getMe: z.object({ user: userSchema(), csrf_token: z.string() }),
    listChatSessions: z.object({ chats: z.array(chatSessionSchema()) }),
    createChatSession: z.object({ chat: chatSessionSchema() }),
    getChatSession: z.object({ chat: chatDetailSchema() }),
    updateChatSession: z.object({ chat: chatSessionSchema() }),
    listChatParticipants: z.object({ participants: z.array(chatParticipantSchema()) }),
    addChatParticipant: z.object({ participant: chatParticipantSchema() }),
    updateChatParticipant: z.object({ participant: chatParticipantSchema() }),
    listMessages: z.object({ messages: z.array(chatMessageSchema()) }),
    submitQuestion: z.object({ message_id: z.string(), run_id: z.string(), status: z.string() }),
    listMessageEvents: z.object({ events: z.array(messageEventSchema()) }),
    cancelAnswerGeneration: z.object({ message_id: z.string(), run_id: z.string(), status: z.string() }),
    createFeedback: z.object({ feedback: feedbackSchema() }),
    listFavorites: z.object({ favorites: z.array(favoriteSchema()) }),
    addFavorite: z.object({ favorite: favoriteSchema() }),
    issueWsTicket: z.object({ ticket: z.string(), expires_in_seconds: z.number().int(), channels: z.array(z.string()) }),
    listLlmModels: z.object({ models: z.array(llmModelSchema()) }),
    adminListUsers: z.object({ users: z.array(userSchema()) }),
    startUserImport: z.object({ import: userImportSchema() }),
    getUserImport: z.object({ import: userImportSchema().optional(), rows: z.array(userImportRowSchema()) }),
    adminListDocuments: z.object({ documents: z.array(documentSchema()) }),
    createDocument: documentMutationSchema(),
    getDocument: z.object({ document: documentDetailSchema().optional() }),
    createDocumentVersion: documentMutationSchema(),
    activateDocumentVersion: z.object({ version: documentVersionSchema().optional() }),
    updateDocumentAcl: z.object({ document: documentDetailSchema() }),
    suspendDocument: z.object({ document: documentDetailSchema() }),
    getIngestionJob: z.object({ job: ingestionJobSchema().optional() }),
    retryIngestionJob: z.object({ job: ingestionJobSchema() }),
    listEvaluationDatasets: z.object({ datasets: z.array(evaluationDatasetSchema()) }),
    startEvaluationRun: z.object({ evaluation_run: evaluationRunSchema() }),
    getEvaluationRun: z.object({ evaluation_run: evaluationRunSchema().optional(), items: z.array(evaluationRunItemSchema()) }),
    listPublishedArtifacts: z.object({ artifacts: z.array(publishedArtifactSchema()) }),
    issueArtifactAccessCookie: z.object({ cookie_issued: z.boolean(), expires_in_seconds: z.number().int() })
  };
  return (schemas[route.operationId] ?? z.object({}).passthrough()).openapi(route.zodSchemaNames.response);
}

function userSchema() {
  return z.object({
    tenant_id: z.string(),
    user_id: z.string(),
    email: z.string(),
    display_name: z.string(),
    role: z.string(),
    department: z.string().optional(),
    employment_type: z.string().optional(),
    status: z.string()
  }).passthrough();
}

function chatSessionSchema() {
  return z.object({
    tenant_id: z.string(),
    chat_id: z.string(),
    title: z.string(),
    status: z.string(),
    last_message_at: z.string().nullable().optional(),
    created_by_user_id: z.string(),
    created_at: z.string(),
    updated_at: z.string()
  }).passthrough();
}

function chatDetailSchema() {
  return chatSessionSchema().extend({
    participants: z.array(chatParticipantSchema()),
    messages: z.array(chatMessageSchema())
  });
}

function chatParticipantSchema() {
  return z.object({
    tenant_id: z.string(),
    chat_id: z.string(),
    user_id: z.string(),
    participant_role: z.string(),
    status: z.string(),
    added_by_user_id: z.string(),
    added_at: z.string()
  }).passthrough();
}

function chatMessageSchema() {
  return z.object({
    tenant_id: z.string(),
    chat_id: z.string(),
    message_id: z.string(),
    sender_type: z.string(),
    content_text: z.string(),
    status: z.string(),
    created_at: z.string(),
    feedback: feedbackSchema().nullable().optional()
  }).passthrough();
}

function messageEventSchema() {
  return z.object({
    tenant_id: z.string(),
    chat_id: z.string(),
    message_id: z.string(),
    event_seq: z.number().int(),
    event_id: z.string(),
    event_name: z.string(),
    event_type: z.enum(["progress", "partial", "final", "error"]),
    payload_json: z.record(z.unknown()),
    created_at: z.string()
  });
}

function favoriteSchema() {
  return z.object({
    tenant_id: z.string(),
    favorite_id: z.string(),
    user_id: z.string(),
    created_at: z.string()
  }).passthrough();
}

function feedbackSchema() {
  return z.object({
    tenant_id: z.string(),
    feedback_id: z.string(),
    user_id: z.string(),
    chat_id: z.string().nullable().optional(),
    message_id: z.string().nullable().optional(),
    rating: z.string().optional(),
    comment: z.string().nullable().optional(),
    problem_type: z.string().nullable().optional(),
    created_at: z.string()
  }).passthrough();
}

function llmModelSchema() {
  return z.object({
    tenant_id: z.string(),
    model_id: z.string(),
    display_name: z.string(),
    provider: z.string(),
    model_type: z.string(),
    capability_json: z.record(z.unknown()),
    status: z.string(),
    visible_to_user: z.boolean(),
    allowed_role: z.string(),
    default_for_task: z.string(),
    catalog_version: z.string()
  });
}

function userImportSchema() {
  return z.object({
    tenant_id: z.string(),
    import_id: z.string(),
    status: z.string(),
    result_s3_prefix: z.string(),
    result_report_json: z.object({
      created: z.number().int(),
      updated: z.number().int(),
      deleted: z.number().int(),
      failed: z.number().int(),
      error_rows_s3_uri: z.string()
    }),
    created_by_user_id: z.string()
  });
}

function userImportRowSchema() {
  return z.object({
    tenant_id: z.string(),
    import_id: z.string(),
    row_number: z.number().int(),
    action: z.string(),
    status: z.string(),
    target_user_id: z.string().nullable().optional(),
    error_message: z.string().nullable().optional()
  });
}

function documentSchema() {
  return z.object({
    tenant_id: z.string(),
    document_id: z.string(),
    title: z.string(),
    status: z.string(),
    created_by_user_id: z.string(),
    created_at: z.string(),
    updated_at: z.string()
  });
}

function documentDetailSchema() {
  return documentSchema().extend({
    versions: z.array(documentVersionSchema()),
    ingestion_jobs: z.array(ingestionJobSchema()),
    acl_entries: z.array(documentAclEntrySchema())
  });
}

function documentMutationSchema() {
  return z.object({
    document_id: z.string(),
    version_id: z.string(),
    job_id: z.string().optional(),
    raw_s3_uri: z.string(),
    idempotent: z.boolean().optional()
  });
}

function documentVersionSchema() {
  return z.object({
    tenant_id: z.string(),
    document_id: z.string(),
    version_id: z.string(),
    version_label: z.string(),
    status: z.string(),
    raw_s3_uri: z.string(),
    metadata_json: z.record(z.unknown()),
    created_at: z.string()
  });
}

function documentAclEntrySchema() {
  return z.object({
    tenant_id: z.string(),
    document_id: z.string(),
    version_id: z.string(),
    acl_scope_id: z.string(),
    effect: z.string()
  });
}

function ingestionJobSchema() {
  return z.object({
    tenant_id: z.string(),
    job_id: z.string(),
    document_id: z.string(),
    version_id: z.string(),
    status: z.string(),
    raw_s3_uri: z.string(),
    parsed_s3_prefix: z.string(),
    error_code: z.string().nullable().optional(),
    retryable: z.boolean()
  });
}

function evaluationDatasetSchema() {
  return z.object({
    tenant_id: z.string(),
    dataset_id: z.string(),
    dataset_name: z.string(),
    status: z.string(),
    source_s3_uri: z.string(),
    created_at: z.string()
  });
}

function evaluationRunSchema() {
  return z.object({
    tenant_id: z.string(),
    evaluation_run_id: z.string(),
    dataset_id: z.string(),
    model_id: z.string(),
    prompt_version: z.string(),
    retrieval_config_json: z.record(z.unknown()),
    artifact_s3_prefix: z.string(),
    status: z.string(),
    metrics_json: z.record(z.unknown()),
    created_by_user_id: z.string()
  });
}

function evaluationRunItemSchema() {
  return z.object({
    tenant_id: z.string(),
    evaluation_run_id: z.string(),
    case_id: z.string(),
    status: z.string(),
    answer_text: z.string().nullable().optional(),
    retrieved_context_json: z.record(z.unknown()).nullable().optional(),
    judge_result_json: z.record(z.unknown()).nullable().optional(),
    metrics_json: z.record(z.unknown()).nullable().optional()
  });
}

function publishedArtifactSchema() {
  return z.object({
    tenant_id: z.string(),
    artifact_id: z.string(),
    artifact_type: z.string(),
    title: z.string(),
    source_ref: z.string(),
    viewer_path: z.string(),
    status: z.string()
  }).passthrough();
}

const numericString = z
  .string()
  .regex(/^\d+$/)
  .transform((value) => Number(value));
