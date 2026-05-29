import { createLocalApi } from "../local-api.js";
import { createUnboundDsqlApiRepository, type DsqlApiRepository } from "../repositories/dsql/apiRepository";
import type { ApiDispatcher } from "../hono-openapi-app";

export interface ApiDispatchServiceOptions {
  repository?: DsqlApiRepository;
  runtimeMode?: "local-fixture" | "dsql";
}

export function createApiDispatchService(options: ApiDispatchServiceOptions = {}): ApiDispatcher {
  if (options.runtimeMode === "dsql") {
    const repository = options.repository ?? createUnboundDsqlApiRepository();
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
