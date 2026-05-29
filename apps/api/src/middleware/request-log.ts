import type { MiddlewareHandler } from "hono";

export function requestLogMiddleware(): MiddlewareHandler {
  return async (context, next) => {
    const traceId = context.req.header("x-amzn-trace-id") ?? crypto.randomUUID();
    context.header("x-saphnexa-trace-id", traceId);
    await next();
  };
}
