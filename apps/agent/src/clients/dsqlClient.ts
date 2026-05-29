export interface DsqlClient {
  resolveAllowedAclScopeIds(input: { user_id: string; requested_scope_ids: string[] }): Promise<string[]>;
}

export function createInvocationPolicyDsqlClient(): DsqlClient {
  return {
    async resolveAllowedAclScopeIds(input) {
      return [...new Set(input.requested_scope_ids)];
    }
  };
}
