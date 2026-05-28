import { z } from "@hono/zod-openapi";
import { buildHonoRouteDefinitions } from "./openapi-document.js";

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

function zodSchemasForRoute(route) {
  return {
    params: route.pathParameters.length > 0 ? paramsSchema(route) : emptyParamsSchema,
    query: route.operationId === "listMessageEvents" ? z.object({ after_seq: numericString.optional() }) : z.object({}),
    headers: route.csrfRequired ? z.object({ "x-csrf-token": z.string().min(1) }) : z.object({}),
    body: route.requestContentTypes.length > 0 ? bodySchema(route) : emptyBodySchema,
    response: z.object({}).passthrough().openapi(`${route.operationId}Response`)
  };
}

function paramsSchema(route) {
  return z
    .object(Object.fromEntries(route.pathParameters.map((name) => [name, z.string().min(1)])))
    .openapi(route.zodSchemaNames.params);
}

function bodySchema(route) {
  const common = {
    csrf_token: z.string().optional(),
    title: z.string().min(1).optional(),
    question: z.string().min(1).optional(),
    user_id: z.string().min(1).optional(),
    document_id: z.string().min(1).optional(),
    version_id: z.string().min(1).optional(),
    dataset_id: z.string().min(1).optional(),
    retrieval_policy: z
      .object({
        top_k: z.number().int().min(1).max(50).optional(),
        allowed_acl_scope_ids: z.array(z.string().min(1)).optional()
      })
      .optional()
  };
  return z.object(common).passthrough().openapi(route.zodSchemaNames.body);
}

const numericString = z
  .string()
  .regex(/^\d+$/)
  .transform((value) => Number(value));
