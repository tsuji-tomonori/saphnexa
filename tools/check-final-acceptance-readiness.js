import { existsSync } from "node:fs";
import { finalReadinessPath } from "./final-acceptance-readiness.js";
import { acceptanceCatalog, acceptanceCatalogPath, acceptanceIds } from "./acceptance-ids.js";
import { assert, readJson, readText } from "./lib.js";

assert(existsSync(finalReadinessPath), `final readiness file missing: ${finalReadinessPath}`);

const readiness = readJson(finalReadinessPath);
const traceRows = parseTraceRows(readText("docs/acceptance/traceability.md"));
const unresolvedTraceIds = traceRows.filter((row) => row.state !== "local_verified").map((row) => row.id);
const blockingIds = readiness.blocking_acceptance_ids.map((row) => row.id);

assert(readiness.schema_version === "saphnexa-final-acceptance-readiness.v1", "final readiness schema version mismatch");
assert(readiness.final_acceptance_ready === false, "final readiness must not claim completion while blockers remain");
assert(readiness.source_catalog.path === acceptanceCatalogPath, "final readiness source catalog path mismatch");
assert(readiness.source_catalog.item_count === acceptanceCatalog.item_count, "final readiness source catalog item count mismatch");
assert(JSON.stringify(readiness.source_catalog.priority_counts) === JSON.stringify(acceptanceCatalog.priority_counts), "final readiness source priority counts mismatch");
assert(readiness.trace_state_counts.requires_aws > 0, "final readiness must preserve AWS blockers");
assert(readiness.release_gate.ready === false, "release gate must remain pending");
assert(readiness.aws_gate.ready === false, "AWS gate must remain pending");
assert(readiness.checklist_gate.ready === false, "checklist gate must remain pending");
assert(readiness.defect_gate.ready === true, "defect gate should be ready when blocker/critical open count is 0");
assert(readiness.final_candidate_gate.ready === false, "final candidate gate must remain pending until final files exist");
assert(readiness.final_candidate_gate.status === "not_ready", "final candidate status must be not_ready during local preflight");
assert(readiness.final_candidate_gate.missing_files.length > 0, "final candidate missing files must be explicit");
assert(readiness.external_action_gate.ready === false, "external action gate must remain pending");
assert(readiness.external_action_gate.status === "pending_external_actions", "external action status mismatch");
assert(readiness.external_action_gate.pending_action_ids.length > 0, "external action pending ids must be explicit");
assert(readiness.external_action_gate.requires_confirmation === true, "external actions must require confirmation");
assert(JSON.stringify(readiness.finalization_commands) === JSON.stringify([
  "npm run acceptance:external-actions:build",
  "npm run acceptance:external-actions:check",
  "npm run acceptance:final-candidate:fixture:check",
  "npm run acceptance:final-candidate:check",
  "npm run acceptance:final:build",
  "npm run acceptance:final:check",
  "npm run acceptance:package:build",
  "npm run acceptance:package:check"
]), "finalization command order mismatch");

for (const id of unresolvedTraceIds) {
  assert(acceptanceIds.includes(id), `unknown acceptance id in trace: ${id}`);
  assert(blockingIds.includes(id), `final readiness missing blocker ${id}`);
}
for (const id of blockingIds) {
  assert(unresolvedTraceIds.includes(id), `final readiness has stale blocker ${id}`);
}
for (const id of ["AC-001", "AC-002", "AC-004", "AC-081", "AC-150", "AC-151", "AC-152"]) {
  assert(blockingIds.includes(id), `final readiness must keep ${id} pending`);
}

assert(readiness.priority_gates.P0_all_pass === false, "P0 gate must not pass");
assert(readiness.priority_gates.P1_all_pass === false, "P1 gate must not pass");
assert(readiness.priority_gates.P2_all_pass === true, "P2 gate should pass when no P2 blockers remain");
assert(readiness.priority_gates.unresolved_by_priority.P0.includes("AC-150"), "AC-150 must remain a P0 aggregate blocker");
assert(readiness.priority_gates.unresolved_by_priority.P0.includes("AC-151"), "AC-151 must remain a P0 aggregate blocker");
assert(readiness.priority_gates.unresolved_by_priority.P1.includes("AC-152"), "AC-152 must remain a P1 aggregate blocker");

for (const gate of [readiness.release_gate, readiness.aws_gate, readiness.checklist_gate]) {
  const pending = gate.pending || gate.pending_acceptance_ids || [];
  assert(pending.length > 0, "pending final evidence must be explicit");
}
assert(readiness.note.includes("must not be used as proof"), "final readiness limitation note missing");

console.log("final acceptance readiness check passed");

function parseTraceRows(body) {
  return [...body.matchAll(/^\| (AC-\d{3}) \| ([a-z_]+) \| (.+) \|$/gm)]
    .map((match) => ({ id: match[1], state: match[2], evidence: match[3] }));
}
