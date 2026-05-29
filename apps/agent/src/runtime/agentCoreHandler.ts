import { AgentInvocationSchema, type AgentInvocationResult } from "../schemas/invocation";
import { createRagAgentRuntime, type RagAgentRuntime } from "../agent/ragAgent";

export interface AgentCoreHttpResult {
  status: number;
  body: AgentInvocationResult | { error_code: string; message: string; details?: unknown };
}

export async function handleAgentCoreInvocation(payload: unknown, runtime: RagAgentRuntime = createRagAgentRuntime()): Promise<AgentCoreHttpResult> {
  const parsed = AgentInvocationSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: 400,
      body: {
        error_code: "INVALID_INVOCATION",
        message: "Agent invocation payload is invalid.",
        details: parsed.error.flatten()
      }
    };
  }

  const result = await runtime.invoke(parsed.data);
  return {
    status: result.status === "failed" ? 500 : 202,
    body: result
  };
}
