import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { publicApiRoutes } from "../../../packages/api-contract/src/routes.js";
import { createLocalApi } from "./local-api.js";

export type ActorId = string | null;

export interface ApiRuntime {
  request(actorId: ActorId, operationId: string, input?: Record<string, unknown>): {
    status: number;
    body: unknown;
  };
}

export interface SaphnexaApiOptions {
  runtime?: ApiRuntime;
  actorFromRequest?: (request: Request) => ActorId;
}

const ErrorResponse = z.object({
  trace_id: z.string(),
  error_code: z.string(),
  message: z.string(),
  details: z.record(z.unknown())
});

const JsonBody = z.record(z.unknown()).openapi("JsonBody");
const JsonResponse = z.unknown().openapi("JsonResponse");

export function createSaphnexaApiApp(options: SaphnexaApiOptions = {}) {
  const runtime = options.runtime ?? createLocalApi();
  const actorFromRequest = options.actorFromRequest ?? defaultActorFromRequest;
  const app = new OpenAPIHono();

  app.doc("/openapi.json", {
    openapi: "3.0.3",
    info: {
      title: "Saphnexa API",
      version: "0.1.0"
    }
  });

  for (const routeMeta of publicApiRoutes) {
    const route = createRoute({
      method: routeMeta.method.toLowerCase() as "get" | "post" | "patch" | "delete",
      path: routeMeta.internalPath.replaceAll("{", ":").replaceAll("}", ""),
      operationId: routeMeta.operationId,
      request: routeMeta.requestContentTypes.length
        ? {
            body: {
              content: {
                "application/json": {
                  schema: JsonBody
                }
              }
            }
          }
        : undefined,
      responses: buildResponses(routeMeta.successStatuses)
    });

    app.openapi(route, async (c) => {
      const input = await readInput(c.req.raw, routeMeta.csrfRequired);
      const response = runtime.request(actorFromRequest(c.req.raw), routeMeta.operationId, input);
      if (response.status === 204) return c.body(null, 204);
      return c.json(response.body, response.status as 200);
    });
  }

  return app;
}

function buildResponses(successStatuses: number[]) {
  const responses: Record<number, { description: string; content?: Record<string, { schema: typeof JsonResponse | typeof ErrorResponse }> }> = {};
  for (const status of successStatuses) {
    responses[status] = {
      description: `Saphnexa API success ${status}`,
      content: status === 204 || status === 302 ? undefined : { "application/json": { schema: JsonResponse } }
    };
  }
  for (const status of [400, 401, 403, 404, 409, 500]) {
    responses[status] = {
      description: `Saphnexa API error ${status}`,
      content: { "application/json": { schema: ErrorResponse } }
    };
  }
  return responses;
}

async function readInput(request: Request, csrfRequired: boolean) {
  const input: Record<string, unknown> = {};
  if (request.headers.get("content-type")?.includes("application/json")) {
    Object.assign(input, await request.json());
  }
  if (csrfRequired) input.csrf_token = request.headers.get("x-csrf-token") ?? "";
  return input;
}

function defaultActorFromRequest(request: Request) {
  return request.headers.get("x-saphnexa-actor-id") ?? null;
}

export const app = createSaphnexaApiApp();
