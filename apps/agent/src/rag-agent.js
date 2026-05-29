// Compatibility export for existing local Node checks. The TypeScript source of
// record lives in agent/retrievalPolicy.ts.
export function assertRetrievalPolicyNotRelaxed(inputPolicy, effectivePolicy) {
  const inputTopK = inputPolicy.top_k ?? 10;
  const effectiveTopK = effectivePolicy.top_k ?? 10;
  if (effectiveTopK > inputTopK) throw new Error("retrieval_policy top_k was relaxed");
  const inputScopes = new Set(inputPolicy.allowed_acl_scope_ids || []);
  for (const scope of effectivePolicy.allowed_acl_scope_ids || []) {
    if (!inputScopes.has(scope)) throw new Error(`retrieval_policy scope was relaxed: ${scope}`);
  }
  return true;
}
