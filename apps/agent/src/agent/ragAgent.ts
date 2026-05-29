import { AgentInvocationSchema, type AgentInvocation, type AgentInvocationResult } from "../schemas/invocation";
import { createUnavailableBedrockRuntimeClient, type BedrockRuntimeClient } from "../clients/bedrockRuntimeClient";
import { createInvocationPolicyDsqlClient, type DsqlClient } from "../clients/dsqlClient";
import { createUnavailableToolsApiClient, type ToolsApiClient } from "../clients/toolsApiClient";
import { generateAnswer } from "./answerGeneration";
import { bindCitations } from "./citationBinding";
import { packContext } from "./contextPacking";
import { rewriteQuery } from "./queryRewrite";
import { assertRetrievalPolicyNotRelaxed, normalizeRetrievalPolicy } from "./retrievalPolicy";

export interface RagAgentRuntime {
  invoke(input: AgentInvocation): Promise<AgentInvocationResult>;
}

export interface RagAgentRuntimeOptions {
  tools?: ToolsApiClient;
  bedrock?: BedrockRuntimeClient;
  dsql?: DsqlClient;
}

export function createRagAgentRuntime(options: RagAgentRuntimeOptions = {}): RagAgentRuntime {
  const tools = options.tools ?? createUnavailableToolsApiClient();
  const bedrock = options.bedrock ?? createUnavailableBedrockRuntimeClient();
  const dsql = options.dsql ?? createInvocationPolicyDsqlClient();

  return {
    async invoke(input) {
      const invocation = AgentInvocationSchema.parse(input);
      const allowedScopes = await dsql.resolveAllowedAclScopeIds({
        user_id: invocation.user_id,
        requested_scope_ids: invocation.retrieval_policy.allowed_acl_scope_ids
      });
      const effectivePolicy = normalizeRetrievalPolicy({
        ...invocation.retrieval_policy,
        allowed_acl_scope_ids: allowedScopes
      });
      assertRetrievalPolicyNotRelaxed(invocation.retrieval_policy, effectivePolicy);

      const rewritten = rewriteQuery(invocation.question);
      await tools.bm25Search({
        run_id: invocation.invocation_id,
        query: rewritten.retrieval_query,
        retrieval_policy: effectivePolicy
      });
      const retrieved = await tools.kbRetrieve({
        run_id: invocation.invocation_id,
        query: rewritten.retrieval_query,
        retrieval_policy: effectivePolicy
      });
      const acl = await tools.aclCheck({
        run_id: invocation.invocation_id,
        user_id: invocation.user_id,
        candidates: retrieved.results
      });
      const expanded = await tools.referenceExpand({
        run_id: invocation.invocation_id,
        source_nodes: acl.allowed.map((item) => ({ node_id: item.chunk_id, document_id: item.document_id })),
        max_hops: 1
      });
      const evidencePack = await tools.evidencePack({
        run_id: invocation.invocation_id,
        chunks: acl.allowed.concat(expanded.nodes),
        token_budget: 1800
      });
      const packedContext = packContext(evidencePack.evidence);
      const answer = await generateAnswer({
        question: rewritten.original_question,
        packedContext,
        bedrock
      });

      if (answer.support_status === "insufficient_evidence") {
        return {
          invocation_id: invocation.invocation_id,
          status: "refused",
          refusal_reason: answer.answer_text,
          citations: []
        };
      }

      const cited = await bindCitations({
        run_id: invocation.invocation_id,
        answer_text: answer.answer_text,
        evidence: packedContext.evidence,
        tools
      });

      return {
        invocation_id: invocation.invocation_id,
        status: cited.citations.length > 0 ? "accepted" : "refused",
        answer: cited.citations.length > 0 ? cited.answer_text : undefined,
        citations: cited.citations.map((citation) => ({
          document_id: citation.document_id,
          version_id: citation.version_id,
          page: citation.display?.page
        })),
        refusal_reason: cited.citations.length > 0 ? undefined : "引用を evidence へ束縛できないため、回答を返しません。"
      };
    }
  };
}
