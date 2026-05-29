import type { MiddlewareHandler } from "hono";

export interface SessionMiddlewareOptions {
  actorHeaderName?: string;
}

export function sessionMiddleware(options: SessionMiddlewareOptions = {}): MiddlewareHandler {
  const actorHeaderName = options.actorHeaderName ?? "x-saphnexa-actor-id";
  return async (context, next) => {
    const actorId = context.req.header(actorHeaderName);
    if (actorId) context.header("x-saphnexa-session-actor", actorId);
    await next();
  };
}
