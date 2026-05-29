import { readJson, readText, assert } from "./lib.js";
import { buildHonoRouteDefinitions, buildOpenApiDocument } from "../apps/api/src/openapi-document.js";
import { publicApiRoutes } from "../packages/api-contract/src/routes.js";

const apiPackage = readJson("apps/api/package.json");
const appSource = readText("apps/api/src/hono-openapi-app.ts");
const appWrapperSource = readText("apps/api/src/hono-openapi-app.js");
const openApiSource = readText("apps/api/src/openapi-document.ts");
const openApiWrapperSource = readText("apps/api/src/openapi-document.js");
const zodSource = readText("apps/api/src/zod-openapi-schemas.ts");
const zodWrapperSource = readText("apps/api/src/zod-openapi-schemas.js");
const document = buildOpenApiDocument();
const definitions = buildHonoRouteDefinitions();

assert(apiPackage.dependencies?.hono, "apps/api must declare hono dependency");
assert(apiPackage.dependencies?.["@hono/zod-openapi"], "apps/api must declare @hono/zod-openapi dependency");
assert(apiPackage.dependencies?.zod, "apps/api must declare zod dependency");
assert(apiPackage.scripts?.["openapi:print"] === "node src/openapi-document.js", "apps/api openapi print script mismatch");

assert(appSource.includes("OpenAPIHono"), "Hono app must use OpenAPIHono");
assert(appSource.includes("createRoute"), "Hono app must use createRoute");
assert(appSource.includes("app.doc(\"/openapi.json\""), "Hono app must expose /openapi.json");
assert(appSource.includes("x-saphnexa-actor-id"), "Hono app must carry actor boundary through header mapping");
assert(appSource.includes("interface ApiDispatcher"), "Hono app TypeScript source must type the dispatcher boundary");
assert(openApiSource.includes("export type HonoRouteDefinition"), "OpenAPI TypeScript source must export HonoRouteDefinition");
assert(zodSource.includes("@hono/zod-openapi"), "Zod schema catalog must use @hono/zod-openapi");
assert(zodSource.includes("buildRouteZodSchemas"), "Zod schema catalog must export route schemas");
assert(appWrapperSource.includes("OpenAPIHono"), "Hono JS runtime mirror must keep OpenAPIHono compatibility");
assert(openApiWrapperSource.includes("buildOpenApiDocument"), "OpenAPI JS runtime mirror must keep existing Node compatibility");
assert(zodWrapperSource.includes("buildRouteZodSchemas"), "Zod JS runtime mirror must keep existing Node compatibility");

assert(document.openapi === "3.1.0", "OpenAPI version mismatch");
assert(document.info.title === "Saphnexa Hono API", "OpenAPI title mismatch");
assert(openApiOperationCount(document) === publicApiRoutes.length, "OpenAPI operation count must match public API routes");
assert(definitions.length === publicApiRoutes.length, "Hono route definition count must match public API routes");

const operationIds = [];
for (const route of publicApiRoutes) {
  const pathItem = document.paths[route.internalPath];
  assert(pathItem, `OpenAPI document missing ${route.internalPath}`);
  const operation = pathItem[route.method.toLowerCase()];
  assert(operation, `OpenAPI document missing ${route.method} ${route.internalPath}`);
  assert(operation.operationId === route.operationId, `${route.id} operationId mismatch`);
  assert(operation["x-saphnexa-api-id"] === route.id, `${route.id} x-saphnexa-api-id mismatch`);
  assert(operation["x-saphnexa-viewer-path"] === route.viewerPath, `${route.id} viewer path mismatch`);
  assert(operation["x-saphnexa-zod-validation"] === true, `${route.id} must record Zod validation`);
  assert(JSON.stringify(operation["x-saphnexa-roles"]) === JSON.stringify(route.roles), `${route.id} roles mismatch`);
  assert(operation["x-saphnexa-csrf-required"] === route.csrfRequired, `${route.id} CSRF metadata mismatch`);
  if (route.csrfRequired) {
    assert(JSON.stringify(operation.security).includes("csrfHeader"), `${route.id} state-changing route must require csrfHeader`);
  }
  if (route.csrfRequired && route.requestContentTypes.includes("application/json")) {
    assert(
      operation.requestBody?.content?.["application/json"]?.schema?.properties?.csrf_token?.type === "string",
      `${route.id} state-changing JSON route must expose csrf_token request body schema`
    );
  }
  operationIds.push(operation.operationId);
}

assert(
  document.paths["/v1/chat-sessions/{chat_id}/messages"].post.responses["202"].content["application/json"].schema.properties.message_id.type === "string",
  "submitQuestion response schema must expose message_id"
);
assert(
  document.paths["/v1/chat-sessions/{chat_id}/messages/{message_id}/events"].get.responses["200"].content["application/json"].schema.properties.events.type === "array",
  "listMessageEvents response schema must expose events array"
);
assert(
  document.paths["/v1/admin/artifacts"].get.responses["200"].content["application/json"].schema.properties.artifacts.type === "array",
  "listPublishedArtifacts response schema must expose artifacts array"
);

assert(new Set(operationIds).size === publicApiRoutes.length, "OpenAPI operationIds must be unique");
for (const definition of definitions) {
  assert(definition.honoPath.startsWith("/v1/"), `${definition.id} Hono path must stay under /v1`);
  assert(!definition.honoPath.includes("{"), `${definition.id} Hono path must use :param syntax`);
  assert(definition.zodSchemaNames.error === "errorResponseSchema", `${definition.id} must map error schema`);
}

console.log("Hono/Zod/OpenAPI check passed");

function openApiOperationCount(document) {
  return Object.values(document.paths).flatMap((pathItem) => Object.keys(pathItem)).length;
}
