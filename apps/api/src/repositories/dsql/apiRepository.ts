import type { ApiOperationId } from "@saphnexa/api-contract";

export interface ApiRepositoryRequest {
  actorId: string | undefined;
  operationId: ApiOperationId | string;
  input: Record<string, unknown>;
}

export interface ApiRepositoryResponse {
  status: number;
  body: unknown;
}

export interface DsqlApiRepository {
  execute(request: ApiRepositoryRequest): Promise<ApiRepositoryResponse> | ApiRepositoryResponse;
}

export function createUnboundDsqlApiRepository(): DsqlApiRepository {
  return {
    execute(request) {
      return {
        status: 501,
        body: {
          error_code: "DSQL_REPOSITORY_NOT_BOUND",
          message: "Aurora DSQL repository is not configured.",
          details: { operationId: request.operationId }
        }
      };
    }
  };
}
