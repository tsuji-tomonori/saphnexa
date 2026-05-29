import { AgentInvocationResultSchema, AgentInvocationSchema, type AgentInvocationResult } from "../schemas/invocation";
import { createRagAgentRuntime, type RagAgentRuntime } from "../agent/ragAgent";

export interface AgentCoreHttpResult {
  status: number;
  body: AgentInvocationResult | AgentCoreErrorBody;
}

export interface AgentCoreErrorBody {
  error_code: string;
  message: string;
  details?: unknown;
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

  try {
    const result = AgentInvocationResultSchema.safeParse(await runtime.invoke(parsed.data));
    if (!result.success) {
      return {
        status: 500,
        body: {
          error_code: "INVALID_INVOCATION_RESULT",
          message: "Agent runtime returned a payload outside the invocation result schema.",
          details: result.error.flatten()
        }
      };
    }

    return {
      status: result.data.status === "failed" ? 500 : 202,
      body: result.data
    };
  } catch (error) {
    return {
      status: 500,
      body: {
        invocation_id: parsed.data.invocation_id,
        status: "failed",
        citations: [],
        refusal_reason: error instanceof Error ? error.message : "Agent runtime failed."
      }
    };
  }
}

export function agentCoreHttpStatus(status: number): 202 | 400 | 500 {
  if (status === 202 || status === 400 || status === 500) return status;
  return 500;
}
