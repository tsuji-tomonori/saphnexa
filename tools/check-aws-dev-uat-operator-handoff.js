import { existsSync } from "node:fs";
import {
  awsDevUatOperatorHandoffPath,
  buildAwsDevUatOperatorHandoff,
  requiredAwsDevUatOperatorHandoffActionIds
} from "./aws-dev-uat-operator-handoff.js";
import { assert, isCurrentJstTimestamp, readJson } from "./lib.js";

const args = process.argv.slice(2);
if (process.argv[1]?.endsWith("check-aws-dev-uat-operator-handoff.js")) {
  const outputPath = valueFor(args, "--output") || awsDevUatOperatorHandoffPath;
  const handoff = buildAwsDevUatOperatorHandoff({ outputPath });
  validateAwsDevUatOperatorHandoff(handoff);
  console.log(`AWS dev/UAT operator handoff check passed: ${outputPath} (${handoff.execution_status})`);
}

export function validateAwsDevUatOperatorHandoff(handoff) {
  assert(handoff.schema_version === "saphnexa-aws-dev-uat-operator-handoff.v1", "operator handoff schema mismatch");
  assert(isCurrentJstTimestamp(handoff.generated_at), "operator handoff generated_at must be current JST timestamp");
  assert(handoff.generated_by === "tools/check-aws-dev-uat-operator-handoff.js", "operator handoff generated_by mismatch");
  assert(/^[a-f0-9]{40}$/.test(handoff.git_commit_sha), "operator handoff git commit mismatch");
  assert(handoff.handoff_ready === true, "operator handoff must be ready to hand off pending actions");
  assert(["blocked_by_external_execution", "ready_for_final_acceptance_package"].includes(handoff.execution_status), "operator handoff execution status mismatch");
  assert(handoff.aws_ready === (handoff.execution_status === "ready_for_final_acceptance_package"), "operator handoff AWS ready mismatch");
  assert(handoff.external_state_change === false, "operator handoff must not change external state");
  assert(handoff.does_not_execute_commands === true, "operator handoff must not execute commands");
  assert(existsOrGeneratedPath(handoff.source_artifacts.external_action_plan), "operator handoff external action plan path mismatch");
  assert(existsOrGeneratedPath(handoff.source_artifacts.raw_capture_plan), "operator handoff raw capture plan path mismatch");
  assert(existsOrGeneratedPath(handoff.source_artifacts.final_readiness), "operator handoff final readiness path mismatch");
  assert(handoff.required_inputs.region === "ap-northeast-1", "operator handoff region mismatch");
  assert(handoff.required_inputs.approval_required_for.includes("cdk deploy"), "operator handoff must require deploy approval");
  assert(handoff.required_inputs.approval_required_for.includes("Bedrock evaluation"), "operator handoff must require Bedrock approval");

  const actionIds = new Set(handoff.execution_groups.flatMap((group) => group.action_ids));
  for (const id of requiredAwsDevUatOperatorHandoffActionIds()) {
    assert(actionIds.has(id), `operator handoff missing action ${id}`);
  }
  for (const group of handoff.execution_groups) {
    assert(group.status === "pending", `${group.id} must stay pending before external execution`);
    assert(group.requires_confirmation === true, `${group.id} must require confirmation`);
    assert(group.candidate_commands.length > 0, `${group.id} must list candidate commands`);
    assert(group.evidence_outputs.length > 0, `${group.id} must list evidence outputs`);
  }
  for (const command of [
    "cdk deploy --context env=uat",
    "npm run aws:dev-uat:execution-bridge:probe",
    "npm run aws:dev-uat:preflight:final",
    "npm run test:e2e:aws",
    "npm run perf:aws",
    "npm run rag:quality:aws",
    "npm run aws:dev-uat:validation:final",
    "npm run aws:dev-uat:final-readiness:check -- --probe-aws-identity --require-ready"
  ]) {
    assert(handoff.critical_command_order.includes(command), `operator handoff missing critical command: ${command}`);
  }
  assert(
    handoff.critical_command_order.indexOf("cdk deploy --context env=uat") <
      handoff.critical_command_order.indexOf("npm run aws:dev-uat:execution-bridge:probe"),
    "operator handoff must deploy before AWS validation probe"
  );
  assert(
    handoff.critical_command_order.indexOf("npm run aws:dev-uat:validation:final") <
      handoff.critical_command_order.indexOf("npm run aws:dev-uat:final-readiness:check -- --probe-aws-identity --require-ready"),
    "operator handoff must run final readiness after validation final gate"
  );
  for (const output of [
    "dist/acceptance/aws_dev_uat_execution_bridge.json",
    "dist/acceptance/aws_dev_uat_raw_capture_plan.json",
    "dist/acceptance/aws_dev_uat_preflight.json",
    "dist/acceptance/aws_dev_uat_validation.json",
    "dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json",
    "dist/acceptance/aws_dev_uat_final_readiness.json"
  ]) {
    assert(handoff.evidence_outputs.includes(output), `operator handoff missing evidence output: ${output}`);
  }
  if (handoff.aws_ready) {
    assert(handoff.blockers.length === 0, "AWS-ready handoff must not have blockers");
  } else {
    assert(handoff.blockers.length > 0, "blocked handoff must list blockers");
    assert(handoff.next_commands.length > 0, "blocked handoff must list next commands");
  }
  assert(handoff.note.includes("does not deploy"), "operator handoff must state it does not deploy");
  assert(handoff.note.includes("approval-required execution plan"), "operator handoff must state approval scope");

  if (existsSync(handoff.source_artifacts.external_action_plan)) readJson(handoff.source_artifacts.external_action_plan);
}

function existsOrGeneratedPath(path) {
  return typeof path === "string" && path.startsWith("dist/acceptance/");
}

function valueFor(items, name) {
  const index = items.indexOf(name);
  if (index < 0) return null;
  return items[index + 1] || null;
}
