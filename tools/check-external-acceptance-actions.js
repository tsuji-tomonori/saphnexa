import { existsSync } from "node:fs";
import { externalActionPlanPath, requiredExternalActionIds } from "./external-acceptance-actions.js";
import { assert, readJson, readText } from "./lib.js";

assert(existsSync(externalActionPlanPath), `external action plan missing: ${externalActionPlanPath}`);

const plan = readJson(externalActionPlanPath);
const unresolvedTraceIds = parseTraceRows(readText("docs/acceptance/traceability.md"))
  .filter((row) => row.state !== "local_verified")
  .map((row) => row.id);

assert(plan.schema_version === "saphnexa-external-acceptance-action-plan.v1", "external action plan schema mismatch");
assert(plan.ready === false, "external action plan must remain not ready until actions are completed");
assert(plan.status === "pending_external_actions", "external action plan status mismatch");

for (const id of requiredExternalActionIds()) {
  assert(plan.actions.some((action) => action.id === id), `missing external action ${id}`);
}
for (const id of unresolvedTraceIds) {
  assert(plan.blocking_acceptance_ids.includes(id), `external action plan missing blocker ${id}`);
  assert(plan.actions.some((action) => action.acceptance_ids.includes(id)), `no external action covers ${id}`);
}
for (const action of plan.actions) {
  assert(action.status === "pending", `${action.id} must remain pending`);
  assert(action.completed === false, `${action.id} must not be completed by preflight`);
  assert(action.requires_confirmation === true, `${action.id} must require confirmation`);
  assert(action.external_state_change === true, `${action.id} must be marked as external state change`);
  assert(action.candidate_commands.length > 0, `${action.id} must list candidate commands`);
  assert(action.required_before_run.length > 0, `${action.id} must list prerequisites`);
  assert(action.evidence_outputs.length > 0, `${action.id} must list evidence outputs`);
}
assert(plan.pending_action_ids.length === plan.actions.length, "all actions must be pending before external execution");
assert(plan.note.includes("require explicit confirmation"), "external action confirmation note missing");

console.log("external acceptance action plan check passed");

function parseTraceRows(body) {
  return [...body.matchAll(/^\| (AC-\d{3}) \| ([a-z_]+) \| (.+) \|$/gm)]
    .map((match) => ({ id: match[1], state: match[2], evidence: match[3] }));
}
