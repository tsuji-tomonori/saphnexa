import { createLocalApi } from "../local-api.js";
import { createDsqlApiRepository, type DsqlApiRepository, type DsqlCsrfTokenIssuer, type DsqlQueryExecutor } from "../repositories/dsql/apiRepository";
import type { ApiDispatcher } from "../hono-openapi-app";

export interface ApiDispatchServiceOptions {
  dsqlCsrfTokenIssuer?: DsqlCsrfTokenIssuer;
  dsqlExecutor?: DsqlQueryExecutor;
  repository?: DsqlApiRepository;
  runtimeMode?: "local-fixture" | "dsql";
}

export function createApiDispatchService(options: ApiDispatchServiceOptions = {}): ApiDispatcher {
  if (options.runtimeMode === "dsql") {
    const repository = options.repository ?? createDsqlApiRepository({
      ...(options.dsqlCsrfTokenIssuer ? { csrfTokenIssuer: options.dsqlCsrfTokenIssuer } : {}),
      ...(options.dsqlExecutor ? { executor: options.dsqlExecutor } : {})
    });
    return {
      request(actorId, operationId, input) {
        return repository.execute({ actorId, operationId, input });
      }
    };
  }
  return createLocalApi();
}

export function createApiDispatchServiceFromEnvironment(env: Record<string, string | undefined> = process.env): ApiDispatcher {
  return createApiDispatchService({
    runtimeMode: env.SAPHNEXA_API_RUNTIME_MODE === "dsql" ? "dsql" : "local-fixture"
  });
}
