import { createErrorResponse } from "@saphnexa/domain";
import type { MiddlewareHandler } from "hono";

export function errorMiddleware(): MiddlewareHandler {
  return async (context, next) => {
    try {
      await next();
    } catch (error) {
      const failure = error instanceof Error ? error : new Error("Unexpected API failure");
      return context.json(createErrorResponse("INTERNAL_ERROR", failure.message), 500);
    }
  };
}
