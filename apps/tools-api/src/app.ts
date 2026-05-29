import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createLocalTools } from "@saphnexa/rag-core";
import { toolContracts } from "@saphnexa/tool-contract";

export interface ToolsApiOptions {
  store: unknown;
}

const ToolBody = z.record(z.unknown()).openapi("ToolRequest");
const ToolResponse = z.unknown().openapi("ToolResponse");
const ToolError = z.object({
  error_code: z.string(),
  message: z.string().optional(),
  details: z.record(z.unknown()).optional()
});

export function createSaphnexaToolsApiApp(options: ToolsApiOptions) {
  const tools = createLocalTools(options.store);
  const app = new OpenAPIHono();

  app.doc("/openapi.json", {
    openapi: "3.0.3",
    info: {
      title: "Saphnexa Tools API",
      version: "0.1.0"
    }
  });

  for (const contract of toolContracts) {
    const route = createRoute({
      method: "post",
      path: contract.path,
      operationId: contract.operationId,
      request: {
        body: {
          content: {
            "application/json": {
              schema: ToolBody
            }
          }
        }
      },
      responses: {
        200: {
          description: `${contract.toolName} success`,
          content: { "application/json": { schema: ToolResponse } }
        },
        400: {
          description: `${contract.toolName} invalid request`,
          content: { "application/json": { schema: ToolError } }
        },
        403: {
          description: `${contract.toolName} denied`,
          content: { "application/json": { schema: ToolError } }
        },
        404: {
          description: `${contract.toolName} handler not found`,
          content: { "application/json": { schema: ToolError } }
        },
        500: {
          description: `${contract.toolName} failed`,
          content: { "application/json": { schema: ToolError } }
        }
      }
    });

    app.openapi(route, async (c) => {
      const body = await c.req.json();
      const handler = tools[contract.operationId as keyof typeof tools] as ((input: unknown) => unknown) | undefined;
      if (!handler) return c.json({ error_code: "TOOL_NOT_FOUND", details: { operationId: contract.operationId } }, 404);
      return c.json(handler(body), 200);
    });
  }

  return app;
}
