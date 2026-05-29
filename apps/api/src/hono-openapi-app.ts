import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { createErrorResponse } from "@saphnexa/domain";
import { csrfBoundaryMiddleware } from "./middleware/csrf";
import { errorMiddleware } from "./middleware/error";
import { originMiddleware } from "./middleware/origin";
import { requestLogMiddleware } from "./middleware/request-log";
import { sessionMiddleware } from "./middleware/session";
import { buildHonoRouteDefinitions, buildOpenApiDocument, type HonoRouteDefinition } from "./openapi-document";
import { buildRouteZodSchemas, errorResponseSchema } from "./zod-openapi-schemas";

export interface ApiDispatcher {
  request(actorId: string | undefined, operationId: string, input: Record<string, unknown>): Promise<{ status: number; body: unknown }> | { status: number; body: unknown };
}

export function createSaphnexaHonoOpenApiApp({ dispatcher }: { dispatcher?: ApiDispatcher } = {}) {
  const app = new OpenAPIHono();
  const routeSchemas = buildRouteZodSchemas();

  app.use("*", errorMiddleware());
  app.use("*", requestLogMiddleware());
  app.use("*", originMiddleware());
  app.use("*", sessionMiddleware());
  app.use("*", csrfBoundaryMiddleware());

  app.doc("/openapi.json", buildOpenApiDocument());

  for (const definition of buildHonoRouteDefinitions()) {
    const schemas = routeSchemas[definition.operationId];
    if (!schemas) throw new Error(`missing zod schemas for ${definition.operationId}`);
    app.openapi(honoRoute(definition, schemas) as any, async (context: any) => {
      if (!dispatcher) {
        return context.json(createErrorResponse("API_DISPATCHER_NOT_BOUND", "Hono API dispatcher is not configured", { operationId: definition.operationId }), 500);
      }
      const result = await dispatchRequest(context, dispatcher, definition);
      return result.status === 204 ? context.body(null, 204) : context.json(result.body, result.status as 200);
    });
  }

  return app;
}

function honoRoute(definition: HonoRouteDefinition, schemas: ReturnType<typeof buildRouteZodSchemas>[string]) {
  const request = {
    params: schemas.params,
    query: schemas.query,
    headers: schemas.headers,
    ...(definition.requestContentTypes.length > 0
      ? {
          body: {
            content: {
              "application/json": {
                schema: schemas.body
              }
            }
          }
        }
      : {})
  };
  return createRoute({
    method: definition.method.toLowerCase() as "get" | "post" | "patch" | "delete",
    path: definition.honoPath,
    operationId: definition.operationId,
    request,
    responses: Object.fromEntries([
      ...definition.successStatuses.map((status) => [
        status,
        status === 204 || status === 302
          ? { description: `${status} response` }
          : { description: "success", content: { "application/json": { schema: schemas.response } } }
      ]),
      [400, standardErrorResponse()],
      [401, standardErrorResponse()],
      [403, standardErrorResponse()],
      [404, standardErrorResponse()],
      [500, standardErrorResponse()]
    ])
  });
}

async function dispatchRequest(context: { req: { header: (name: string) => string | undefined; param: () => Record<string, string>; query: () => Record<string, string>; json: () => Promise<Record<string, unknown>> } }, dispatcher: ApiDispatcher, definition: HonoRouteDefinition) {
  const actorId = context.req.header("x-saphnexa-actor-id");
  const input = {
    ...context.req.param(),
    ...context.req.query(),
    ...(definition.requestContentTypes.length > 0 ? await context.req.json() : {})
  };
  const csrf = context.req.header("x-csrf-token");
  if (csrf && input.csrf_token === undefined) input.csrf_token = csrf;
  return dispatcher.request(actorId, definition.operationId, input);
}

function standardErrorResponse() {
  return {
    description: "standard error",
    content: {
      "application/json": {
        schema: errorResponseSchema
      }
    }
  };
}
