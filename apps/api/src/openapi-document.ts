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
    getMe: objectSchema(["user", "csrf_token"], { user: jsonObjectSchema(), csrf_token: stringSchema() }),
    listChatSessions: objectSchema(["chats"], { chats: arrayOf(jsonObjectSchema()) }),
    createChatSession: objectSchema(["chat"], { chat: jsonObjectSchema() }),
    getChatSession: objectSchema(["chat"], { chat: jsonObjectSchema() }),
    updateChatSession: objectSchema(["chat"], { chat: jsonObjectSchema() }),
    listChatParticipants: objectSchema(["participants"], { participants: arrayOf(jsonObjectSchema()) }),
    addChatParticipant: objectSchema(["participant"], { participant: jsonObjectSchema() }),
    updateChatParticipant: objectSchema(["participant"], { participant: jsonObjectSchema() }),
    listMessages: objectSchema(["messages"], { messages: arrayOf(jsonObjectSchema()) }),
    submitQuestion: objectSchema(["message_id", "run_id", "status"], { message_id: stringSchema(), run_id: stringSchema(), status: stringSchema() }),
    listMessageEvents: objectSchema(["events"], { events: arrayOf(jsonObjectSchema()) }),
    cancelAnswerGeneration: objectSchema(["message_id", "run_id", "status"], { message_id: stringSchema(), run_id: stringSchema(), status: stringSchema() }),
    createFeedback: objectSchema(["feedback"], { feedback: jsonObjectSchema() }),
    listFavorites: objectSchema(["favorites"], { favorites: arrayOf(jsonObjectSchema()) }),
    addFavorite: objectSchema(["favorite"], { favorite: jsonObjectSchema() }),
    issueWsTicket: objectSchema(["ticket", "expires_in_seconds", "channels"], { ticket: stringSchema(), expires_in_seconds: integerSchema(), channels: arrayOf(stringSchema()) }),
    listLlmModels: objectSchema(["models"], { models: arrayOf(jsonObjectSchema()) }),
    adminListUsers: objectSchema(["users"], { users: arrayOf(jsonObjectSchema()) }),
    startUserImport: objectSchema(["import"], { import: jsonObjectSchema() }),
    getUserImport: objectSchema(["import", "rows"], { import: jsonObjectSchema(), rows: arrayOf(jsonObjectSchema()) }),
    adminListDocuments: objectSchema(["documents"], { documents: arrayOf(jsonObjectSchema()) }),
    createDocument: objectSchema(["document_id", "version_id", "job_id", "raw_s3_uri"], { document_id: stringSchema(), version_id: stringSchema(), job_id: stringSchema(), raw_s3_uri: stringSchema(), idempotent: booleanSchema() }),
    getDocument: objectSchema(["document"], { document: jsonObjectSchema() }),
    createDocumentVersion: objectSchema(["document_id", "version_id", "job_id", "raw_s3_uri"], { document_id: stringSchema(), version_id: stringSchema(), job_id: stringSchema(), raw_s3_uri: stringSchema(), idempotent: booleanSchema() }),
    activateDocumentVersion: objectSchema(["version"], { version: jsonObjectSchema() }),
    getIngestionJob: objectSchema(["job"], { job: jsonObjectSchema() }),
    retryIngestionJob: objectSchema(["job"], { job: jsonObjectSchema() }),
    listEvaluationDatasets: objectSchema(["datasets"], { datasets: arrayOf(jsonObjectSchema()) }),
    startEvaluationRun: objectSchema(["evaluation_run"], { evaluation_run: jsonObjectSchema() }),
    getEvaluationRun: objectSchema(["evaluation_run"], { evaluation_run: jsonObjectSchema() }),
    listPublishedArtifacts: objectSchema(["artifacts"], { artifacts: arrayOf(jsonObjectSchema()) }),
    issueArtifactAccessCookie: objectSchema(["cookie_issued", "expires_in_seconds"], { cookie_issued: booleanSchema(), expires_in_seconds: integerSchema() })
  };
  return schemas[route.operationId] ?? jsonObjectSchema();
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

function integerSchema() {
  return { type: "integer" };
}

function booleanSchema() {
  return { type: "boolean" };
}

function removeUndefined(value: JsonObject) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
