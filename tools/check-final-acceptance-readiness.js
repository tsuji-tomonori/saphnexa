import { existsSync } from "node:fs";
import { finalReadinessPath } from "./final-acceptance-readiness.js";
import { acceptanceIds } from "./acceptance-ids.js";
import { assert, readJson, readText } from "./lib.js";

assert(existsSync(finalReadinessPath), `final readiness file missing: ${finalReadinessPath}`);

const readiness = readJson(finalReadinessPath);
const traceRows = parseTraceRows(readText("docs/acceptance/traceability.md"));
const unresolvedTraceIds = traceRows.filter((row) => row.state !== "local_verified").map((row) => row.id);
const blockingIds = readiness.blocking_acceptance_ids.map((row) => row.id);

assert(readiness.schema_version === "saphnexa-final-acceptance-readiness.v1", "final readiness schema version mismatch");
assert(readiness.final_acceptance_ready === false, "final readiness must not claim completion while blockers remain");
assert(readiness.trace_state_counts.requires_aws > 0, "final readiness must preserve AWS blockers");
assert(readiness.release_gate.ready === false, "release gate must remain pending");
assert(readiness.aws_gate.ready === false, "AWS gate must remain pending");
assert(readiness.checklist_gate.ready === false, "checklist gate must remain pending");
assert(readiness.defect_gate.ready === true, "defect gate should be ready when blocker/critical open count is 0");

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
