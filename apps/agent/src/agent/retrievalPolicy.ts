import type { RetrievalPolicy } from "../schemas/invocation";

export function assertRetrievalPolicyNotRelaxed(inputPolicy: Partial<RetrievalPolicy>, effectivePolicy: Partial<RetrievalPolicy>) {
  const inputTopK = inputPolicy.top_k ?? 10;
  const effectiveTopK = effectivePolicy.top_k ?? 10;
  if (effectiveTopK > inputTopK) throw new Error("retrieval_policy top_k was relaxed");

  const inputScopes = new Set(inputPolicy.allowed_acl_scope_ids || []);
  for (const scope of effectivePolicy.allowed_acl_scope_ids || []) {
    if (!inputScopes.has(scope)) throw new Error(`retrieval_policy scope was relaxed: ${scope}`);
  }
  return true;
}

export function normalizeRetrievalPolicy(policy: Partial<RetrievalPolicy>): RetrievalPolicy {
  return {
    top_k: Math.min(policy.top_k ?? 10, 10),
    allowed_acl_scope_ids: [...new Set(policy.allowed_acl_scope_ids || [])]
  };
}
