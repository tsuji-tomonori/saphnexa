import { createSaphnexaHonoOpenApiApp, type ApiDispatcher } from "./hono-openapi-app";
import { createApiDispatchService } from "./services/apiDispatchService";

export type ActorId = string | undefined;

export interface SaphnexaApiOptions {
  dispatcher?: ApiDispatcher;
}

export function createSaphnexaApiApp(options: SaphnexaApiOptions = {}) {
  return createSaphnexaHonoOpenApiApp({
    dispatcher: options.dispatcher ?? createApiDispatchService()
  });
}

export const app = createSaphnexaApiApp();
