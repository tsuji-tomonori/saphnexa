import { createErrorResponse } from "@saphnexa/domain";
import type { MiddlewareHandler } from "hono";

export interface OriginMiddlewareOptions {
  allowedOrigins?: readonly string[];
}

export function originMiddleware(options: OriginMiddlewareOptions = {}): MiddlewareHandler {
  return async (context, next) => {
    const origin = context.req.header("origin");
    if (origin && options.allowedOrigins?.length && !options.allowedOrigins.includes(origin)) {
      return context.json(createErrorResponse("ORIGIN_NOT_ALLOWED", "Origin is not allowed", { origin }), 403);
    }
    await next();
  };
}
