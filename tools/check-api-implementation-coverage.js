import { publicApiRoutes } from "../packages/api-contract/src/routes.js";
import { apiImplementationCoverage } from "./implementation-coverage-manifest.js";
import { assert, readText } from "./lib.js";

const productionReady = process.argv.includes("--production-ready");
const allowedStatuses = new Set(["implemented", "aggregate", "external", "async_boundary", "planned", "not_required", "present"]);
const productionPlanned = [];
const planned = [];

const mappingSource = readText("apps/api/src/repositories/dsql/apiRepository.ts");

for (const route of publicApiRoutes) {
  const coverage = apiImplementationCoverage[route.operationId];
  assert(coverage, `${route.operationId} missing implementation coverage entry`);
  for (const field of ["route", "schema", "usecase", "localFixture", "production", "repository", "domainEvent", "audit", "openApi", "unitTest", "localIntegrationTest", "dsqlSmoke", "explicitPlannedMarker"]) {
    assert(allowedStatuses.has(coverage[field]), `${route.operationId}.${field} has invalid status ${coverage[field]}`);
  }
  assert(coverage.route !== "not_required", `${route.operationId} route coverage is required`);
  assert(coverage.schema !== "not_required", `${route.operationId} schema coverage is required`);
  assert(coverage.usecase !== "not_required", `${route.operationId} usecase coverage is required`);
  assert(coverage.localFixture !== "not_required", `${route.operationId} local fixture coverage is required`);
  assert(coverage.openApi === "implemented", `${route.operationId} OpenAPI schema must be implemented`);
  if (coverage.production === "implemented") {
    assert(mappingSource.includes(`${route.operationId}:`), `${route.operationId} marked production implemented but DSQL mapping key was not found`);
  }
  if (coverage.production === "external") {
    assert(coverage.externalReason, `${route.operationId} external production implementation must state a reason`);
  }
  if (Object.values(coverage).includes("planned")) {
    assert(coverage.explicitPlannedMarker === "present", `${route.operationId} planned coverage must set explicitPlannedMarker`);
    planned.push(route.operationId);
  }
  if (coverage.production === "planned") productionPlanned.push(route.operationId);
}

const staleEntries = Object.keys(apiImplementationCoverage).filter((operationId) => !publicApiRoutes.some((route) => route.operationId === operationId));
assert(staleEntries.length === 0, `stale API implementation coverage entries: ${staleEntries.join(", ")}`);

if (productionReady) {
  assert(planned.length === 0, `production-ready API coverage forbids planned markers: ${planned.join(", ")}`);
  assert(productionPlanned.length === 0, `production-ready API coverage forbids planned production operations: ${productionPlanned.join(", ")}`);
}

console.log(`API implementation coverage check passed (${publicApiRoutes.length} operations, ${planned.length} planned markers)`);
