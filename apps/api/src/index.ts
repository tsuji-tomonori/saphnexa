import { handle } from "hono/aws-lambda";
import { createSaphnexaApiApp } from "./app";
import { createApiDispatchServiceFromEnvironment } from "./services/apiDispatchService";

export const app = createSaphnexaApiApp({
  dispatcher: createApiDispatchServiceFromEnvironment()
});

export const handler = handle(app);
