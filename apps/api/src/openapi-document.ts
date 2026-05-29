import { errorResponseSchema, publicApiRoutes } from "../../../packages/api-contract/src/routes.js";

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
    paths[route.internalPath] ||= {};
    paths[route.internalPath][route.method.toLowerCase()] = operation(route);
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
  const parameters = pathParameters(route.internalPath).map((name) => ({
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
        schema: { type: "object", additionalProperties: true }
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
          type: "object",
          additionalProperties: true,
          description: `${route.operationId} request body. Zod runtime schema is defined in apps/api/src/zod-openapi-schemas.ts.`
        }
      }
    }
  };
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

function objectSchema(required: string[], properties: JsonObject) {
  return {
    type: "object",
    required,
    properties,
    additionalProperties: false
  };
}

function removeUndefined(value: JsonObject) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
