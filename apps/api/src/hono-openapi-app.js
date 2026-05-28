import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { createErrorResponse } from "../../../packages/domain/src/index.js";
import { buildHonoRouteDefinitions, buildOpenApiDocument } from "./openapi-document.js";
import { buildRouteZodSchemas, errorResponseSchema } from "./zod-openapi-schemas.js";

export function createSaphnexaHonoOpenApiApp({ dispatcher } = {}) {
  const app = new OpenAPIHono();
  const routeSchemas = buildRouteZodSchemas();

  app.doc("/openapi.json", buildOpenApiDocument());

  for (const definition of buildHonoRouteDefinitions()) {
    const schemas = routeSchemas[definition.operationId];
    app.openapi(honoRoute(definition, schemas), async (context) => {
      if (!dispatcher) {
        return context.json(createErrorResponse("API_DISPATCHER_NOT_BOUND", "Hono API dispatcher is not configured", { operationId: definition.operationId }), 501);
      }
      const result = await dispatchRequest(context, dispatcher, definition);
      return result.status === 204 ? context.body(null, 204) : context.json(result.body, result.status);
    });
  }

  return app;
}

function honoRoute(definition, schemas) {
  return createRoute({
    method: definition.method.toLowerCase(),
    path: definition.honoPath,
    operationId: definition.operationId,
    request: {
      params: schemas.params,
      query: schemas.query,
      headers: schemas.headers,
      body:
        definition.requestContentTypes.length > 0
          ? {
              content: {
                "application/json": {
                  schema: schemas.body
                }
              }
            }
          : undefined
    },
    responses: Object.fromEntries([
      ...definition.successStatuses.map((status) => [
        status,
        status === 204 || status === 302
          ? { description: `${status} response` }
          : { description: "success", content: { "application/json": { schema: schemas.response } } }
      ]),
      [400, errorResponse()],
      [401, errorResponse()],
      [403, errorResponse()],
      [404, errorResponse()],
      [500, errorResponse()]
    ])
  });
}

async function dispatchRequest(context, dispatcher, definition) {
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

function errorResponse() {
  return {
    description: "standard error",
    content: {
      "application/json": {
        schema: errorResponseSchema
      }
    }
  };
}
