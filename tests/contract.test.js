import assert from "node:assert/strict";
import { test } from "node:test";
import { assertPublicApiContract, errorResponseSchema, publicApiRoutes } from "../packages/api-contract/src/routes.js";
import { assertToolContract, toolContracts } from "../packages/tool-contract/src/tools.js";
import { requiredTables } from "../packages/db-schema/src/tables.js";
import { saphnexaConstructs } from "../infra/stacks/saphnexa-app-stack.js";
import { buildOpenApiDocument } from "../apps/api/src/openapi-document.js";

test("public API contract covers the 38 designed routes", () => {
  assert.equal(assertPublicApiContract(), true);
  assert.equal(publicApiRoutes.length, 38);
  assert.equal(publicApiRoutes.filter((route) => route.viewerPath.startsWith("/api/admin/")).length, 15);
  assert.deepEqual(errorResponseSchema.required, ["trace_id", "error_code", "message", "details"]);
});

test("Tools API contract covers the 6 agent tools", () => {
  assert.equal(assertToolContract(), true);
  assert.equal(toolContracts.length, 6);
  assert.deepEqual(toolContracts.map((tool) => tool.toolName), [
    "kb-retrieve",
    "bm25-search",
    "acl-check",
    "reference-expand",
    "evidence-pack",
    "citation-format"
  ]);
});

test("schema catalog and construct inventory match the design counts", () => {
  assert.equal(requiredTables.includes("chat_sessions"), true);
  assert.equal(requiredTables.includes("chat_participants"), true);
  assert.equal(requiredTables.includes("tool_invocations"), true);
  assert.equal(requiredTables.includes("audit_events"), true);
  assert.equal(requiredTables.length, 38);
  assert.equal(saphnexaConstructs.length, 7);
});

test("OpenAPI document is generated from the public API route contract", () => {
  const document = buildOpenApiDocument();
  assert.equal(document.openapi, "3.1.0");
  assert.equal(Object.values(document.paths).flatMap((pathItem) => Object.keys(pathItem)).length, publicApiRoutes.length);
  assert.equal(document.paths["/v1/chat-sessions/{chat_id}/messages"].post.operationId, "submitQuestion");
  assert.equal(document.paths["/v1/admin/artifacts/access-cookie"].post["x-saphnexa-csrf-required"], true);
});
