import { Hono } from "hono";
import { createRagAgentRuntime, type RagAgentRuntime } from "./agent/ragAgent";
import { handleAgentCoreInvocation } from "./runtime/agentCoreHandler";

export interface AgentCoreAppOptions {
  runtime?: RagAgentRuntime;
}

export function createAgentCoreApp(options: AgentCoreAppOptions = {}) {
  const runtime = options.runtime ?? createRagAgentRuntime();
  const app = new Hono();

  app.get("/ping", (c) => c.json({ status: "ok", service: "saphnexa-agent" }));

  app.post("/invocations", async (c) => {
    const result = await handleAgentCoreInvocation(await c.req.json(), runtime);
    return c.json(result.body, result.status as 202);
  });

  return app;
}

export const app = createAgentCoreApp();
