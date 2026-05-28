import { AgentInvocationSchema, type AgentInvocation, type AgentInvocationResult } from "../schemas/invocation";
import { assertRetrievalPolicyNotRelaxed, normalizeRetrievalPolicy } from "./retrievalPolicy";

export interface RagAgentRuntime {
  invoke(input: AgentInvocation): Promise<AgentInvocationResult>;
}

export function createRagAgentRuntime(): RagAgentRuntime {
  return {
    async invoke(input) {
      const invocation = AgentInvocationSchema.parse(input);
      const effectivePolicy = normalizeRetrievalPolicy(invocation.retrieval_policy);
      assertRetrievalPolicyNotRelaxed(invocation.retrieval_policy, effectivePolicy);

      return {
        invocation_id: invocation.invocation_id,
        status: "refused",
        refusal_reason: "実 Bedrock AgentCore / KB 接続は未設定。根拠付き回答生成は tools client 接続後に実行する。",
        citations: []
      };
    }
  };
}
