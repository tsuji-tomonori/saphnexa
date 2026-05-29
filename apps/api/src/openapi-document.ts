import { errorResponseSchema, publicApiRoutes } from "@saphnexa/api-contract";

export const openApiVersion = "3.1.0";

type ApiRoute = (typeof publicApiRoutes)[number];
type JsonObject = Record<string, unknown>;

export function buildOpenApiDocument() {
  return {
    openapi: openApiVersion,
    info: {
      title: "Saphnexa Hono API",
      version: "0.1.0",
      description: "権限制御付きPDF RAG QAプラットフォームの Hono + Zod 実装向け OpenAPI document。"
    },
    servers: [
      { url: "https://{apiDomain}", variables: { apiDomain: { default: "api.dev.saphnexa.example" } } },
      { url: "http://localhost:8787" }
    ],
    security: [{ cookieSession: [] }],
    paths: buildPaths(),
    components: {
      securitySchemes: {
        cookieSession: {
          type: "apiKey",
          in: "cookie",
          name: "__Host-saphnexa-session",
          description: "Cognito callback 後に Hono API が発行する HttpOnly session cookie。"
        },
        csrfHeader: {
          type: "apiKey",
          in: "header",
          name: "x-csrf-token",
          description: "state-changing route で必須の CSRF token。"
        }
      },
      schemas: {
        ErrorResponse: objectSchema(errorResponseSchema.required, {
          trace_id: { type: "string" },
          error_code: { type: "string" },
          message: { type: "string" },
          details: { type: "object", additionalProperties: true }
        }),
        EmptyObject: objectSchema([], {}),
        AcceptedJob: objectSchema(["accepted"], { accepted: { type: "boolean" } })
      }
    }
  };
}

function buildPaths() {
  const paths: Record<string, Record<string, JsonObject>> = {};
  for (const route of publicApiRoutes) {
    const pathItem = (paths[route.internalPath] ||= {});
    pathItem[route.method.toLowerCase()] = operation(route);
  }
  return paths;
}

export function buildHonoRouteDefinitions() {
  return publicApiRoutes.map((route) => ({
    ...route,
    honoPath: toHonoPath(route.internalPath),
    openApiPath: route.internalPath,
    pathParameters: pathParameters(route.internalPath),
    zodSchemaNames: {
      params: pathParameters(route.internalPath).length > 0 ? `${route.operationId}ParamsSchema` : "emptyParamsSchema",
      body: route.requestContentTypes.length > 0 ? `${route.operationId}BodySchema` : "emptyBodySchema",
      response: `${route.operationId}ResponseSchema`,
      error: "errorResponseSchema"
    }
  }));
}

export type HonoRouteDefinition = ReturnType<typeof buildHonoRouteDefinitions>[number];

function operation(route: ApiRoute) {
  const parameters: JsonObject[] = pathParameters(route.internalPath).map((name) => ({
    name,
    in: "path",
    required: true,
    schema: { type: "string", minLength: 1 }
  }));
  if (route.operationId === "listMessageEvents") {
    parameters.push({
      name: "after_seq",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 0 }
    });
  }

  const responses = Object.fromEntries([
    ...route.successStatuses.map((status) => [String(status), response(status, route)]),
    ["400", standardErrorResponse()],
    ["401", standardErrorResponse()],
    ["403", standardErrorResponse()],
    ["404", standardErrorResponse()],
    ["500", standardErrorResponse()]
  ]);

  return removeUndefined({
    operationId: route.operationId,
    tags: [tag(route)],
    summary: `${route.id} ${route.operationId}`,
    description: `${route.viewerPath} から CloudFront/Hono API 経由で ${route.internalPath} に到達する。`,
    parameters,
    security: route.csrfRequired ? [{ cookieSession: [], csrfHeader: [] }] : [{ cookieSession: [] }],
    requestBody: route.requestContentTypes.length > 0 ? jsonRequestBody(route) : undefined,
    responses,
    "x-saphnexa-api-id": route.id,
    "x-saphnexa-viewer-path": route.viewerPath,
    "x-saphnexa-roles": route.roles,
    "x-saphnexa-csrf-required": route.csrfRequired,
    "x-saphnexa-zod-validation": true
  });
}

function response(status: number, route: ApiRoute) {
  if (status === 204 || status === 302) {
    return { description: `${status} response` };
  }
  return {
    description: `${route.operationId} success response`,
    content: {
      "application/json": {
        schema: successResponseSchema(route)
      }
    }
  };
}

function standardErrorResponse() {
  return {
    description: "標準エラーレスポンス",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" }
      }
    }
  };
}

function jsonRequestBody(route: ApiRoute) {
  return {
    required: true,
    content: {
      "application/json": {
        schema: {
          ...requestBodySchema(route),
          description: `${route.operationId} request body. Zod runtime schema is defined in apps/api/src/zod-openapi-schemas.ts.`
        }
      }
    }
  };
}

function requestBodySchema(route: ApiRoute) {
  const common = {
    csrf_token: stringSchema(),
    title: stringSchema(),
    question: stringSchema(),
    user_id: stringSchema(),
    document_id: stringSchema(),
    version_id: stringSchema(),
    version_label: stringSchema(),
    file_name: stringSchema(),
    acl_scope_id: stringSchema(),
    dataset_id: stringSchema(),
    model_id: stringSchema(),
    import_id: stringSchema(),
    job_id: stringSchema(),
    now_ms: integerSchema(),
    rows: arrayOf(jsonObjectSchema()),
    metadata: jsonObjectSchema(),
    retrieval_policy: objectSchema([], {
      top_k: integerSchema(),
      allowed_acl_scope_ids: arrayOf(stringSchema())
    })
  };
  return objectSchema(route.csrfRequired ? ["csrf_token"] : [], common, true);
}

function successResponseSchema(route: ApiRoute) {
  const schemas: Record<string, JsonObject> = {
    getMe: objectSchema(["user", "csrf_token"], { user: userSchema(), csrf_token: stringSchema() }),
    listChatSessions: objectSchema(["chats"], { chats: arrayOf(chatSessionSchema()) }),
    createChatSession: objectSchema(["chat"], { chat: chatSessionSchema() }),
    getChatSession: objectSchema(["chat"], { chat: chatDetailSchema() }),
    updateChatSession: objectSchema(["chat"], { chat: chatSessionSchema() }),
    listChatParticipants: objectSchema(["participants"], { participants: arrayOf(chatParticipantSchema()) }),
    addChatParticipant: objectSchema(["participant"], { participant: chatParticipantSchema() }),
    updateChatParticipant: objectSchema(["participant"], { participant: chatParticipantSchema() }),
    listMessages: objectSchema(["messages"], { messages: arrayOf(chatMessageSchema()) }),
    submitQuestion: objectSchema(["message_id", "run_id", "status"], { message_id: stringSchema(), run_id: stringSchema(), status: stringSchema() }),
    listMessageEvents: objectSchema(["events"], { events: arrayOf(messageEventSchema()) }),
    cancelAnswerGeneration: objectSchema(["message_id", "run_id", "status"], { message_id: stringSchema(), run_id: stringSchema(), status: stringSchema() }),
    createFeedback: objectSchema(["feedback"], { feedback: feedbackSchema() }),
    listFavorites: objectSchema(["favorites"], { favorites: arrayOf(favoriteSchema()) }),
    addFavorite: objectSchema(["favorite"], { favorite: favoriteSchema() }),
    issueWsTicket: objectSchema(["ticket", "expires_in_seconds", "channels"], { ticket: stringSchema(), expires_in_seconds: integerSchema(), channels: arrayOf(stringSchema()) }),
    listLlmModels: objectSchema(["models"], { models: arrayOf(llmModelSchema()) }),
    adminListUsers: objectSchema(["users"], { users: arrayOf(userSchema()) }),
    startUserImport: objectSchema(["import"], { import: userImportSchema() }),
    getUserImport: objectSchema(["import", "rows"], { import: userImportSchema(), rows: arrayOf(userImportRowSchema()) }),
    adminListDocuments: objectSchema(["documents"], { documents: arrayOf(documentSchema()) }),
    createDocument: objectSchema(["document_id", "version_id", "job_id", "raw_s3_uri"], { document_id: stringSchema(), version_id: stringSchema(), job_id: stringSchema(), raw_s3_uri: stringSchema(), idempotent: booleanSchema() }),
    getDocument: objectSchema(["document"], { document: documentDetailSchema() }),
    createDocumentVersion: objectSchema(["document_id", "version_id", "job_id", "raw_s3_uri"], { document_id: stringSchema(), version_id: stringSchema(), job_id: stringSchema(), raw_s3_uri: stringSchema(), idempotent: booleanSchema() }),
    activateDocumentVersion: objectSchema(["version"], { version: documentVersionSchema() }),
    suspendDocument: objectSchema(["document"], { document: documentDetailSchema() }),
    getIngestionJob: objectSchema(["job"], { job: ingestionJobSchema() }),
    retryIngestionJob: objectSchema(["job"], { job: ingestionJobSchema() }),
    listEvaluationDatasets: objectSchema(["datasets"], { datasets: arrayOf(evaluationDatasetSchema()) }),
    startEvaluationRun: objectSchema(["evaluation_run"], { evaluation_run: evaluationRunSchema() }),
    getEvaluationRun: objectSchema(["evaluation_run"], { evaluation_run: evaluationRunSchema() }),
    listPublishedArtifacts: objectSchema(["artifacts"], { artifacts: arrayOf(publishedArtifactSchema()) }),
    issueArtifactAccessCookie: objectSchema(["cookie_issued", "expires_in_seconds"], { cookie_issued: booleanSchema(), expires_in_seconds: integerSchema() })
  };
  return schemas[route.operationId] ?? jsonObjectSchema();
}

function userSchema() {
  return objectSchema(["tenant_id", "user_id", "email", "display_name", "role", "status"], {
    tenant_id: stringSchema(),
    user_id: stringSchema(),
    email: stringSchema(),
    display_name: stringSchema(),
    role: enumStringSchema(["general_user", "admin", "system"]),
    department: stringSchema(),
    employment_type: stringSchema(),
    status: statusSchema(),
    created_at: stringSchema(),
    updated_at: stringSchema()
  });
}

function chatSessionSchema() {
  return objectSchema(["tenant_id", "chat_id", "title", "status", "created_by_user_id", "created_at", "updated_at"], {
    tenant_id: stringSchema(),
    chat_id: stringSchema(),
    title: stringSchema(),
    status: statusSchema(),
    last_message_at: nullableStringSchema(),
    created_by_user_id: stringSchema(),
    created_at: stringSchema(),
    updated_at: stringSchema(),
    deleted_at: nullableStringSchema()
  });
}

function chatDetailSchema() {
  return objectSchema(["tenant_id", "chat_id", "title", "status", "participants", "messages"], {
    ...chatSessionSchema().properties,
    participants: arrayOf(chatParticipantSchema()),
    messages: arrayOf(chatMessageSchema())
  });
}

function chatParticipantSchema() {
  return objectSchema(["tenant_id", "chat_id", "user_id", "participant_role", "status", "added_by_user_id", "added_at"], {
    tenant_id: stringSchema(),
    chat_id: stringSchema(),
    user_id: stringSchema(),
    participant_role: enumStringSchema(["owner", "viewer"]),
    status: statusSchema(),
    added_by_user_id: stringSchema(),
    added_at: stringSchema(),
    removed_at: nullableStringSchema()
  });
}

function chatMessageSchema() {
  return objectSchema(["tenant_id", "chat_id", "message_id", "sender_type", "content_text", "status", "created_at"], {
    tenant_id: stringSchema(),
    chat_id: stringSchema(),
    message_id: stringSchema(),
    parent_message_id: nullableStringSchema(),
    sender_user_id: nullableStringSchema(),
    sender_type: enumStringSchema(["general_user", "admin", "assistant"]),
    content_text: stringSchema(),
    run_id: nullableStringSchema(),
    status: statusSchema(),
    created_at: stringSchema(),
    completed_at: nullableStringSchema()
  });
}

function messageEventSchema() {
  return objectSchema(["tenant_id", "chat_id", "message_id", "event_seq", "event_id", "event_name", "event_type", "payload_json", "created_at"], {
    tenant_id: stringSchema(),
    chat_id: stringSchema(),
    message_id: stringSchema(),
    event_seq: integerSchema(),
    event_id: stringSchema(),
    event_name: stringSchema(),
    event_type: enumStringSchema(["progress", "partial", "final", "error"]),
    payload_json: jsonObjectSchema(),
    created_at: stringSchema()
  });
}

function feedbackSchema() {
  return objectSchema(["tenant_id", "feedback_id", "user_id", "created_at"], {
    tenant_id: stringSchema(),
    feedback_id: stringSchema(),
    user_id: stringSchema(),
    chat_id: nullableStringSchema(),
    message_id: nullableStringSchema(),
    rating: stringSchema(),
    comment: stringSchema(),
    created_at: stringSchema()
  }, true);
}

function favoriteSchema() {
  return objectSchema(["tenant_id", "favorite_id", "user_id", "created_at"], {
    tenant_id: stringSchema(),
    favorite_id: stringSchema(),
    user_id: stringSchema(),
    chat_id: nullableStringSchema(),
    message_id: nullableStringSchema(),
    created_at: stringSchema()
  });
}

function llmModelSchema() {
  return objectSchema(["tenant_id", "model_id", "display_name", "provider", "model_type", "capability_json", "status", "visible_to_user", "allowed_role", "default_for_task", "catalog_version"], {
    tenant_id: enumStringSchema(["global"]),
    model_id: stringSchema(),
    display_name: stringSchema(),
    provider: enumStringSchema(["bedrock"]),
    model_type: enumStringSchema(["chat", "judge", "embedding"]),
    capability_json: objectSchema([], {}, true),
    status: enumStringSchema(["active", "inactive"]),
    visible_to_user: booleanSchema(),
    allowed_role: enumStringSchema(["general_user", "admin", "system"]),
    default_for_task: stringSchema(),
    catalog_version: stringSchema()
  });
}

function userImportSchema() {
  return objectSchema(["tenant_id", "import_id", "status", "result_s3_prefix", "result_report_json", "created_by_user_id"], {
    tenant_id: stringSchema(),
    import_id: stringSchema(),
    status: statusSchema(),
    result_s3_prefix: stringSchema(),
    result_report_json: objectSchema(["created", "updated", "deleted", "failed", "error_rows_s3_uri"], {
      created: integerSchema(),
      updated: integerSchema(),
      deleted: integerSchema(),
      failed: integerSchema(),
      error_rows_s3_uri: stringSchema()
    }),
    created_by_user_id: stringSchema()
  });
}

function userImportRowSchema() {
  return objectSchema(["tenant_id", "import_id", "row_number", "action", "status"], {
    tenant_id: stringSchema(),
    import_id: stringSchema(),
    row_number: integerSchema(),
    action: stringSchema(),
    status: statusSchema(),
    target_user_id: nullableStringSchema(),
    error_message: nullableStringSchema()
  });
}

function documentSchema() {
  return objectSchema(["tenant_id", "document_id", "title", "status", "created_by_user_id", "created_at", "updated_at"], {
    tenant_id: stringSchema(),
    document_id: stringSchema(),
    title: stringSchema(),
    status: statusSchema(),
    created_by_user_id: stringSchema(),
    created_at: stringSchema(),
    updated_at: stringSchema()
  });
}

function documentDetailSchema() {
  return objectSchema(["tenant_id", "document_id", "title", "status", "created_by_user_id", "created_at", "updated_at", "versions", "ingestion_jobs", "acl_entries"], {
    ...documentSchema().properties,
    versions: arrayOf(documentVersionSchema()),
    ingestion_jobs: arrayOf(ingestionJobSchema()),
    acl_entries: arrayOf(documentAclEntrySchema())
  });
}

function documentVersionSchema() {
  return objectSchema(["tenant_id", "document_id", "version_id", "version_label", "status", "raw_s3_uri", "metadata_json", "created_at"], {
    tenant_id: stringSchema(),
    document_id: stringSchema(),
    version_id: stringSchema(),
    version_label: stringSchema(),
    status: enumStringSchema(["active", "archived", "deleted", "failed", "queued", "succeeded", "uploaded"]),
    raw_s3_uri: stringSchema(),
    metadata_json: jsonObjectSchema(),
    created_at: stringSchema()
  });
}

function documentAclEntrySchema() {
  return objectSchema(["tenant_id", "document_id", "version_id", "acl_scope_id", "effect"], {
    tenant_id: stringSchema(),
    document_id: stringSchema(),
    version_id: stringSchema(),
    acl_scope_id: stringSchema(),
    effect: enumStringSchema(["allow", "deny"])
  });
}

function ingestionJobSchema() {
  return objectSchema(["tenant_id", "job_id", "document_id", "version_id", "status", "raw_s3_uri", "parsed_s3_prefix", "retryable"], {
    tenant_id: stringSchema(),
    job_id: stringSchema(),
    document_id: stringSchema(),
    version_id: stringSchema(),
    status: statusSchema(),
    raw_s3_uri: stringSchema(),
    parsed_s3_prefix: stringSchema(),
    error_code: nullableStringSchema(),
    retryable: booleanSchema()
  });
}

function evaluationDatasetSchema() {
  return objectSchema(["tenant_id", "dataset_id", "dataset_name", "status", "source_s3_uri", "created_at"], {
    tenant_id: stringSchema(),
    dataset_id: stringSchema(),
    dataset_name: stringSchema(),
    status: statusSchema(),
    source_s3_uri: stringSchema(),
    created_at: stringSchema()
  });
}

function evaluationRunSchema() {
  return objectSchema(["tenant_id", "evaluation_run_id", "dataset_id", "model_id", "prompt_version", "retrieval_config_json", "artifact_s3_prefix", "status", "metrics_json", "created_by_user_id"], {
    tenant_id: stringSchema(),
    evaluation_run_id: stringSchema(),
    dataset_id: stringSchema(),
    model_id: stringSchema(),
    prompt_version: stringSchema(),
    retrieval_config_json: objectSchema(["top_k"], { top_k: integerSchema() }, true),
    artifact_s3_prefix: stringSchema(),
    status: statusSchema(),
    metrics_json: objectSchema([], {
      retrieval: objectSchema([], { recall_at_10: numberSchema() }, true),
      generation: objectSchema([], { groundedness: numberSchema() }, true),
      end_to_end: objectSchema([], { refusal_accuracy: numberSchema() }, true)
    }, true),
    created_by_user_id: stringSchema()
  });
}

function publishedArtifactSchema() {
  return objectSchema(["tenant_id", "artifact_id", "artifact_type", "title", "viewer_path", "status", "source_ref"], {
    tenant_id: stringSchema(),
    artifact_id: stringSchema(),
    artifact_type: enumStringSchema(["design_doc_html", "allure_report"]),
    title: stringSchema(),
    version_label: stringSchema(),
    source_ref: stringSchema(),
    s3_bucket: stringSchema(),
    s3_prefix: stringSchema(),
    viewer_path: stringSchema(),
    manifest_path: stringSchema(),
    status: stringSchema(),
    checksum: stringSchema(),
    published_by: stringSchema(),
    published_at: stringSchema(),
    expires_at: nullableStringSchema(),
    created_at: stringSchema(),
    updated_at: stringSchema()
  });
}

function statusSchema() {
  return enumStringSchema(["active", "archived", "deleted", "removed", "queued", "running", "streaming", "succeeded", "failed", "canceled"]);
}

function tag(route: ApiRoute) {
  if (route.viewerPath.startsWith("/auth/")) return "auth";
  if (route.viewerPath.startsWith("/api/admin/")) return "admin";
  if (route.viewerPath.includes("chat-sessions")) return "chat";
  if (route.viewerPath.includes("favorites")) return "favorites";
  return "system";
}

function pathParameters(path: string) {
  return [...path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
}

function toHonoPath(path: string) {
  return path.replace(/\{([^}]+)\}/g, ":$1");
}

function objectSchema(required: string[], properties: JsonObject, additionalProperties = false) {
  return {
    type: "object",
    required,
    properties,
    additionalProperties
  };
}

function jsonObjectSchema() {
  return { type: "object", additionalProperties: true };
}

function arrayOf(items: JsonObject) {
  return { type: "array", items };
}

function stringSchema() {
  return { type: "string" };
}

function nullableStringSchema() {
  return { type: ["string", "null"] };
}

function enumStringSchema(values: string[]) {
  return { type: "string", enum: values };
}

function integerSchema() {
  return { type: "integer" };
}

function numberSchema() {
  return { type: "number" };
}

function booleanSchema() {
  return { type: "boolean" };
}

function removeUndefined(value: JsonObject) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
