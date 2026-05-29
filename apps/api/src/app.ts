import { createLocalApi } from "./local-api.js";
import { createSaphnexaHonoOpenApiApp, type ApiDispatcher } from "./hono-openapi-app";

export type ActorId = string | undefined;

export interface SaphnexaApiOptions {
  dispatcher?: ApiDispatcher;
}

export function createSaphnexaApiApp(options: SaphnexaApiOptions = {}) {
  return createSaphnexaHonoOpenApiApp({
    dispatcher: options.dispatcher ?? createLocalApi()
  });
}

export const app = createSaphnexaApiApp();
