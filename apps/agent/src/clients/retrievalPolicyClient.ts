export interface RetrievalPolicyClient {
  resolveAllowedAclScopeIds(input: { user_id: string; requested_scope_ids: string[] }): Promise<string[]>;
}

export function createInvocationPolicyClient(): RetrievalPolicyClient {
  return {
    async resolveAllowedAclScopeIds(input) {
      return [...new Set(input.requested_scope_ids)];
    }
  };
}
