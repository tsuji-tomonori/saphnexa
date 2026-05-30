import { toolContracts } from "../packages/tool-contract/src/tools.js";
import { toolImplementationCoverage } from "./implementation-coverage-manifest.js";
import { assert } from "./lib.js";

const productionReady = process.argv.includes("--production-ready");
const allowedStatuses = new Set(["implemented", "aggregate", "planned", "not_required", "present"]);
const planned = [];

for (const contract of toolContracts) {
  const coverage = toolImplementationCoverage[contract.operationId];
  assert(coverage, `${contract.operationId} missing tool implementation coverage entry`);
  for (const field of ["route", "schema", "usecase", "policy", "requestValidation", "responseValidation", "audit", "timeout", "production", "unitTest", "explicitPlannedMarker"]) {
    assert(allowedStatuses.has(coverage[field]), `${contract.operationId}.${field} has invalid status ${coverage[field]}`);
  }
  assert(coverage.route !== "not_required", `${contract.operationId} route coverage is required`);
  assert(coverage.schema !== "not_required", `${contract.operationId} schema coverage is required`);
  assert(coverage.usecase !== "not_required", `${contract.operationId} usecase coverage is required`);
  assert(coverage.policy !== "not_required", `${contract.operationId} policy coverage is required`);
  assert(coverage.audit === "implemented", `${contract.operationId} audit coverage must be implemented`);
  assert(coverage.timeout === "implemented", `${contract.operationId} timeout coverage must be implemented`);
  if (Object.values(coverage).includes("planned")) {
    assert(coverage.explicitPlannedMarker === "present", `${contract.operationId} planned coverage must set explicitPlannedMarker`);
    planned.push(contract.operationId);
  }
}

const staleEntries = Object.keys(toolImplementationCoverage).filter((operationId) => !toolContracts.some((contract) => contract.operationId === operationId));
assert(staleEntries.length === 0, `stale Tools implementation coverage entries: ${staleEntries.join(", ")}`);

if (productionReady) {
  assert(planned.length === 0, `production-ready Tools coverage forbids planned markers: ${planned.join(", ")}`);
}

console.log(`Tools implementation coverage check passed (${toolContracts.length} tools, ${planned.length} planned markers)`);
