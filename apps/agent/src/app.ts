import { Hono } from "hono";
import { AgentInvocationSchema } from "./schemas/invocation";
import { createRagAgentRuntime, type RagAgentRuntime } from "./agent/ragAgent";

export interface AgentCoreAppOptions {
  runtime?: RagAgentRuntime;
}

export function createAgentCoreApp(options: AgentCoreAppOptions = {}) {
  const runtime = options.runtime ?? createRagAgentRuntime();
  const app = new Hono();

  app.get("/ping", (c) => c.json({ status: "ok", service: "saphnexa-agent" }));

  app.post("/invocations", async (c) => {
    const parsed = AgentInvocationSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error_code: "INVALID_INVOCATION", message: "Agent invocation payload is invalid.", details: parsed.error.flatten() }, 400);
    }
    const result = await runtime.invoke(parsed.data);
    return c.json(result, result.status === "failed" ? 500 : 202);
  });

  return app;
}

export const app = createAgentCoreApp();
