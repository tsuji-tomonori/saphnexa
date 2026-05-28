import { existsSync } from "node:fs";
import { buildAwsDevUatFinalReadiness, awsDevUatFinalReadinessPath } from "./aws-dev-uat-final-readiness.js";
import { assert, isCurrentJstTimestamp, readJson } from "./lib.js";

const args = process.argv.slice(2);
if (process.argv[1]?.endsWith("check-aws-dev-uat-final-readiness.js")) {
  const outputPath = valueFor(args, "--output") || awsDevUatFinalReadinessPath;
  const requireReady = args.includes("--require-ready");

  const manifest = buildAwsDevUatFinalReadiness({
    outputPath,
    probeAwsIdentity: args.includes("--probe-aws-identity")
  });

  validateAwsDevUatFinalReadiness(manifest, { requireReady });

  console.log(`AWS dev/UAT final readiness check passed: ${outputPath} (${manifest.status})`);
}

export function validateAwsDevUatFinalReadiness(manifest, options = {}) {
  assert(manifest.schema_version === "saphnexa-aws-dev-uat-final-readiness.v1", "final readiness schema mismatch");
  assert(isCurrentJstTimestamp(manifest.generated_at), "final readiness generated_at must be current JST timestamp");
  assert(manifest.generated_by === "tools/check-aws-dev-uat-final-readiness.js", "final readiness generated_by mismatch");
  assert(/^[a-f0-9]{40}$/.test(manifest.git_commit_sha), "final readiness git commit mismatch");
  assert(["ready_for_final_acceptance_package", "blocked_by_external_execution"].includes(manifest.status), "final readiness status mismatch");
  assert(manifest.ready === (manifest.status === "ready_for_final_acceptance_package"), "final readiness ready/status mismatch");
  assert(manifest.external_state_change === false, "final readiness must not change external state");
  assert(manifest.does_not_execute_commands === true, "final readiness must only inspect files");
  assert(manifest.raw_capture_plan.path.endsWith("aws_dev_uat_raw_capture_plan.json"), "raw capture plan path mismatch");
  assert(manifest.raw_capture_plan.exists === existsSync(manifest.raw_capture_plan.path), "raw capture plan existence mismatch");
  assert(manifest.execution_bridge.path.endsWith("aws_dev_uat_execution_bridge.json"), "execution bridge path mismatch");
  assert(manifest.operator_input.kind === "operator-input", "operator input kind mismatch");
  assert(manifest.operator_input.path.endsWith("aws_dev_uat_operator_input.json"), "operator input path mismatch");
  assert(manifest.operator_input.exists === existsSync(manifest.operator_input.path), "operator input existence mismatch");
  assert(manifest.aws_identity.command === "aws sts get-caller-identity --output json", "AWS identity command mismatch");
  assert(Array.isArray(manifest.command_order.final_gates), "final gate command order is required");
  assert(manifest.command_order.final_gates.includes("npm run aws:dev-uat:preflight:final"), "preflight final gate missing");
  assert(manifest.command_order.final_gates.includes("npm run aws:dev-uat:validation:final"), "validation final gate missing");
  assert(Array.isArray(manifest.command_order.preflight_finalization), "preflight finalization order is required");
  assert(Array.isArray(manifest.command_order.validation_finalization), "validation finalization order is required");
  assert(Array.isArray(manifest.stages) && manifest.stages.length === 2, "final readiness stages mismatch");
  assert(manifest.stages.some((stage) => stage.mode === "preflight"), "preflight stage missing");
  assert(manifest.stages.some((stage) => stage.mode === "validation"), "validation stage missing");
  for (const stage of manifest.stages) validateStage(stage);
  assert(manifest.evidence_bundle_manifest.path.endsWith("aws_dev_uat_evidence_bundle_manifest.json"), "bundle manifest path mismatch");
  assert(Array.isArray(manifest.blockers), "final readiness blockers must be an array");
  assert(Array.isArray(manifest.next_commands), "final readiness next_commands must be an array");
  if (manifest.ready) {
    assert(manifest.operator_input.ready === true, "ready final readiness must have resolved operator input");
    assert(manifest.blockers.length === 0, "ready final readiness must not have blockers");
    assert(manifest.next_commands.length === 0, "ready final readiness must not have next commands");
  } else {
    assert(manifest.blockers.length > 0, "blocked final readiness must have blockers");
    assert(manifest.next_commands.length > 0, "blocked final readiness must have next commands");
  }
  assert(manifest.note.includes("does not deploy"), "final readiness must state it does not deploy");
  assert(manifest.note.includes("resolved operator input"), "final readiness must mention resolved operator input");
  if (options.requireReady) assert(manifest.ready === true, `AWS dev/UAT final readiness is blocked: ${manifest.blockers.join(", ")}`);

  if (manifest.raw_capture_plan.exists) readJson(manifest.raw_capture_plan.path);
}

function validateStage(stage) {
  assert(["preflight", "validation"].includes(stage.mode), `unexpected stage mode: ${stage.mode}`);
  assert(stage.raw_input.kind === "raw-input", `${stage.mode} raw input kind mismatch`);
  assert(stage.final_evidence.kind === "final-evidence", `${stage.mode} final evidence kind mismatch`);
  assert(Array.isArray(stage.raw_outputs), `${stage.mode} raw outputs must be an array`);
  assert(stage.materialize_command.includes(`aws:dev-uat:${stage.mode === "preflight" ? "preflight" : "validation"}-raw-input:build`), `${stage.mode} materialize command mismatch`);
  assert(stage.raw_output_check_command.includes(`aws:dev-uat:raw-output:check -- ${stage.mode}`), `${stage.mode} raw output check command mismatch`);
  assert(stage.raw_input_check_command.includes(`aws:dev-uat:raw-input:check -- ${stage.mode}`), `${stage.mode} raw input check command mismatch`);
  assert(stage.final_command === `npm run aws:dev-uat:${stage.mode}:final`, `${stage.mode} final command mismatch`);
  assert(stage.finalization_order.indexOf("materialize_command") < stage.finalization_order.indexOf("raw_output_check_command"), `${stage.mode} finalization order mismatch`);
  if (stage.raw_input.exists) {
    assert(stage.raw_outputs.length > 0, `${stage.mode} raw input must expose raw output refs`);
    assert(stage.raw_input.capture_source === "aws-dev-uat-raw-capture", `${stage.mode} capture source mismatch`);
  }
  if (stage.final_evidence.exists) {
    assert(stage.final_evidence.evidence_class === "aws-captured", `${stage.mode} final evidence must be aws-captured`);
  }
}

function valueFor(items, name) {
  const index = items.indexOf(name);
  if (index < 0) return null;
  return items[index + 1] || null;
}
