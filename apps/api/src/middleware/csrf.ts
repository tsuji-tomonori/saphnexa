import { createErrorResponse } from "@saphnexa/domain";
import { publicApiRoutes } from "@saphnexa/api-contract";
import type { MiddlewareHandler } from "hono";

const csrfRequiredPaths = new Set(
  publicApiRoutes
    .filter((route) => route.csrfRequired)
    .map((route) => `${route.method} ${route.internalPath.replace(/\{[^}]+\}/g, "[^/]+")}`)
);

export function csrfBoundaryMiddleware(): MiddlewareHandler {
  return async (context, next) => {
    const method = context.req.method.toUpperCase();
    const pathname = new URL(context.req.url).pathname;
    const requiresCsrf = [...csrfRequiredPaths].some((pattern) => new RegExp(`^${pattern.replace(`${method} `, "")}$`).test(pathname));
    if (requiresCsrf && !context.req.header("x-csrf-token")) {
      return context.json(createErrorResponse("CSRF_TOKEN_MISSING", "CSRF token is required"), 403);
    }
    await next();
  };
}
