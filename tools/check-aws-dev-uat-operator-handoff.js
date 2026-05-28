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
  assertFinalReadinessSummary(handoff.final_readiness_summary, handoff);
  assert(handoff.external_state_change === false, "operator handoff must not change external state");
  assert(handoff.does_not_execute_commands === true, "operator handoff must not execute commands");
  assert(existsOrGeneratedPath(handoff.source_artifacts.external_action_plan), "operator handoff external action plan path mismatch");
  assert(existsOrGeneratedPath(handoff.source_artifacts.raw_capture_plan), "operator handoff raw capture plan path mismatch");
  assert(existsOrGeneratedPath(handoff.source_artifacts.operator_input_scaffold), "operator handoff operator input scaffold path mismatch");
  assert(existsOrGeneratedPath(handoff.source_artifacts.operator_execution_runbook), "operator handoff execution runbook path mismatch");
  assert(existsOrGeneratedPath(handoff.source_artifacts.final_readiness), "operator handoff final readiness path mismatch");
  assert(handoff.required_inputs.region === "ap-northeast-1", "operator handoff region mismatch");
  assert(handoff.required_inputs.operator_input?.scaffold_path === "dist/acceptance/aws_dev_uat_operator_input.scaffold.json", "operator handoff operator input scaffold mismatch");
  assert(handoff.required_inputs.operator_input?.resolved_path === "dist/acceptance/aws_dev_uat_operator_input.json", "operator handoff resolved operator input mismatch");
  assert(
    handoff.required_inputs.operator_input?.resolved_check_command === "npm run aws:dev-uat:operator-input:check -- --input dist/acceptance/aws_dev_uat_operator_input.json --require-resolved",
    "operator handoff resolved operator input check mismatch"
  );
  assert(
    handoff.required_inputs.operator_input?.runbook_check_command === "npm run aws:dev-uat:operator-runbook:check -- --input dist/acceptance/aws_dev_uat_operator_input.json --require-resolved",
    "operator handoff operator runbook check mismatch"
  );
  assert(handoff.required_inputs.approval_required_for.includes("cdk deploy"), "operator handoff must require deploy approval");
  assert(handoff.required_inputs.approval_required_for.includes("Bedrock evaluation"), "operator handoff must require Bedrock approval");
  assertEvidenceInput(handoff.required_inputs.evidence?.preflight, {
    mode: "preflight",
    rawInputSuffix: "aws_dev_uat_preflight.raw.json",
    scaffoldSuffix: "aws_dev_uat_preflight.raw.scaffold.json",
    finalEvidencePath: "dist/acceptance/aws_dev_uat_preflight.json",
    buildCommand: "npm run aws:dev-uat:preflight:build -- --input dist/acceptance/raw/aws_dev_uat_preflight.raw.json",
    finalCommand: "npm run aws:dev-uat:preflight:final"
  });
  assertEvidenceInput(handoff.required_inputs.evidence?.validation, {
    mode: "validation",
    rawInputSuffix: "aws_dev_uat_validation.raw.json",
    scaffoldSuffix: "aws_dev_uat_validation.raw.scaffold.json",
    finalEvidencePath: "dist/acceptance/aws_dev_uat_validation.json",
    buildCommand: "npm run aws:dev-uat:validation:build -- --input dist/acceptance/raw/aws_dev_uat_validation.raw.json",
    finalCommand: "npm run aws:dev-uat:validation:final"
  });
  assert(
    handoff.required_inputs.evidence?.evidence_bundle?.manifest_path === "dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json",
    "operator handoff evidence bundle path mismatch"
  );
  assert(
    handoff.required_inputs.evidence?.evidence_bundle?.check_command.includes("npm run aws:dev-uat:evidence-bundle:check") &&
      handoff.required_inputs.evidence.evidence_bundle.check_command.includes("--preflight-raw-input") &&
      handoff.required_inputs.evidence.evidence_bundle.check_command.includes("aws_dev_uat_preflight.raw.json") &&
      handoff.required_inputs.evidence.evidence_bundle.check_command.includes("--validation-raw-input") &&
      handoff.required_inputs.evidence.evidence_bundle.check_command.includes("aws_dev_uat_validation.raw.json") &&
      handoff.required_inputs.evidence.evidence_bundle.check_command.includes("--output dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json"),
    "operator handoff evidence bundle check command mismatch"
  );

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
    "npm run aws:dev-uat:operator-input:check",
    "npm run aws:dev-uat:operator-input:check -- --input dist/acceptance/aws_dev_uat_operator_input.json --require-resolved",
    "npm run aws:dev-uat:operator-runbook:check -- --input dist/acceptance/aws_dev_uat_operator_input.json --require-resolved",
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
    "dist/acceptance/aws_dev_uat_operator_input.scaffold.json",
    "dist/acceptance/aws_dev_uat_operator_input.json",
    "dist/acceptance/aws_dev_uat_operator_execution_runbook.json",
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

function assertFinalReadinessSummary(summary, handoff) {
  assert(summary?.status === handoff.execution_status, "operator handoff final readiness summary status mismatch");
  assert(summary.ready === handoff.aws_ready, "operator handoff final readiness summary ready mismatch");
  assert(Array.isArray(summary.blockers), "operator handoff final readiness summary blockers must be an array");
  assert(Array.isArray(summary.next_commands), "operator handoff final readiness summary next commands must be an array");
  assert(summary.evidence_bundle?.manifest_path === "dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json", "operator handoff final readiness bundle path mismatch");
  assert(typeof summary.evidence_bundle.exists === "boolean", "operator handoff final readiness bundle existence flag is required");
  assert(typeof summary.evidence_bundle.ready === "boolean", "operator handoff final readiness bundle ready flag is required");
  assert(typeof summary.evidence_bundle.current_git_commit === "boolean", "operator handoff final readiness bundle git flag is required");
  assert(typeof summary.evidence_bundle.invalid_content === "boolean", "operator handoff final readiness bundle invalid flag is required");
  assert(typeof summary.evidence_bundle.stale === "boolean", "operator handoff final readiness bundle stale flag is required");
  assert(summary.evidence_bundle.artifact_count === null || Number.isInteger(summary.evidence_bundle.artifact_count), "operator handoff final readiness bundle artifact count mismatch");
  assert(typeof summary.evidence_bundle.artifact_count_matches === "boolean", "operator handoff final readiness bundle artifact count match flag is required");
  assert(typeof summary.evidence_bundle.required_artifacts_present === "boolean", "operator handoff final readiness bundle coverage flag is required");
  assert(typeof summary.evidence_bundle.all_artifacts_metadata_matches === "boolean", "operator handoff final readiness bundle metadata flag is required");
  assert(typeof summary.evidence_bundle.all_artifacts_scope_matches === "boolean", "operator handoff final readiness bundle scope flag is required");
  if (handoff.aws_ready) {
    assert(summary.evidence_bundle.ready === true, "AWS-ready handoff must summarize a ready evidence bundle");
    assert(summary.evidence_bundle.current_git_commit === true, "AWS-ready handoff must summarize current evidence bundle git");
    assert(summary.evidence_bundle.required_artifacts_present === true, "AWS-ready handoff must summarize artifact coverage");
    assert(summary.evidence_bundle.all_artifacts_metadata_matches === true, "AWS-ready handoff must summarize artifact metadata match");
    assert(summary.evidence_bundle.all_artifacts_scope_matches === true, "AWS-ready handoff must summarize artifact scope match");
  }
}

function assertEvidenceInput(actual, expected) {
  assert(pathEndsWith(actual?.raw_input_path, expected.rawInputSuffix), `${expected.mode} raw input path mismatch`);
  assert(pathEndsWith(actual?.raw_input_scaffold_path, expected.scaffoldSuffix), `${expected.mode} raw input scaffold path mismatch`);
  assert(
    actual?.raw_output_check_command === `npm run aws:dev-uat:raw-output:check -- ${expected.mode} --input ${actual.raw_input_path}`,
    `${expected.mode} raw output check command mismatch`
  );
  assert(
    actual?.raw_input_check_command === `npm run aws:dev-uat:raw-input:check -- ${expected.mode} --input ${actual.raw_input_path}`,
    `${expected.mode} raw input check command mismatch`
  );
  assert(actual?.final_evidence_path === expected.finalEvidencePath, `${expected.mode} final evidence path mismatch`);
  assert(actual?.build_command === expected.buildCommand, `${expected.mode} build command mismatch`);
  assert(actual?.final_command === expected.finalCommand, `${expected.mode} final command mismatch`);
}

function pathEndsWith(path, suffix) {
  return typeof path === "string" && path.endsWith(suffix) && !path.split(/[\\/]/).includes("..");
}

function existsOrGeneratedPath(path) {
  return typeof path === "string" && path.startsWith("dist/acceptance/");
}

function valueFor(items, name) {
  const index = items.indexOf(name);
  if (index < 0) return null;
  return items[index + 1] || null;
}
