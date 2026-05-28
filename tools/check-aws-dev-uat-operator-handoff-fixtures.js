import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildExternalAcceptanceActionPlan } from "./external-acceptance-actions.js";
import { buildAwsDevUatRawCapturePlan } from "./aws-dev-uat-raw-capture-plan.js";
import { buildAwsDevUatFinalReadiness } from "./aws-dev-uat-final-readiness.js";
import { buildAwsDevUatOperatorHandoff } from "./aws-dev-uat-operator-handoff.js";
import { validateAwsDevUatOperatorHandoff } from "./check-aws-dev-uat-operator-handoff.js";
import { assert } from "./lib.js";

const tmpRoot = mkdtempSync(join(tmpdir(), "saphnexa-aws-dev-uat-operator-handoff-"));

try {
  const externalActionPlan = buildExternalAcceptanceActionPlan(join(tmpRoot, "external_action_plan.json"));
  const rawCapturePlan = buildAwsDevUatRawCapturePlan({
    outputPath: join(tmpRoot, "aws_dev_uat_raw_capture_plan.json"),
    captureRoot: join(tmpRoot, "raw"),
    runId: "operator-handoff-fixture"
  });
  const finalReadiness = buildAwsDevUatFinalReadiness({
    outputPath: join(tmpRoot, "aws_dev_uat_final_readiness.json"),
    rawCapturePlan,
    rawCapturePlanPath: join(tmpRoot, "aws_dev_uat_raw_capture_plan.json"),
    finalReadinessPath: join(tmpRoot, "aws_dev_uat_final_readiness.json")
  });

  const handoff = buildAwsDevUatOperatorHandoff({
    outputPath: join(tmpRoot, "aws_dev_uat_operator_handoff.json"),
    externalActionPlan,
    externalActionPlanPath: "dist/acceptance/external_action_plan.json",
    rawCapturePlan,
    rawCapturePlanPath: "dist/acceptance/aws_dev_uat_raw_capture_plan.json",
    finalReadiness,
    finalReadinessPath: "dist/acceptance/aws_dev_uat_final_readiness.json"
  });
  validateAwsDevUatOperatorHandoff(handoff);
  assert(handoff.handoff_ready === true, "operator handoff fixture must be ready for handoff");
  assert(handoff.aws_ready === false, "operator handoff fixture must not mark AWS ready");
  assert(handoff.execution_groups.every((group) => group.status === "pending"), "all handoff groups must stay pending");
  assert(handoff.execution_groups.every((group) => group.requires_confirmation === true), "all handoff groups must require confirmation");
  assert(handoff.required_inputs.evidence.preflight.raw_input_path.endsWith("aws_dev_uat_preflight.raw.json"), "handoff must include preflight raw input path");
  assert(handoff.required_inputs.evidence.preflight.final_evidence_path.endsWith("aws_dev_uat_preflight.json"), "handoff must include preflight final evidence path");
  assert(handoff.required_inputs.evidence.validation.raw_input_path.endsWith("aws_dev_uat_validation.raw.json"), "handoff must include validation raw input path");
  assert(handoff.required_inputs.evidence.validation.final_evidence_path.endsWith("aws_dev_uat_validation.json"), "handoff must include validation final evidence path");
  assert(handoff.required_inputs.evidence.evidence_bundle.check_command.includes("aws:dev-uat:evidence-bundle:check"), "handoff must include evidence bundle check command");
  assert(handoff.final_readiness_summary.status === "blocked_by_external_execution", "handoff must summarize blocked final readiness");
  assert(handoff.final_readiness_summary.evidence_bundle.manifest_path.endsWith("aws_dev_uat_evidence_bundle_manifest.json"), "handoff must summarize evidence bundle path");
  assert(handoff.final_readiness_summary.evidence_bundle.required_artifacts_present === false, "blocked handoff must summarize missing bundle coverage");
  assert(handoff.final_readiness_summary.evidence_bundle.all_artifacts_metadata_matches === false, "blocked handoff must summarize bundle metadata gate");
  assert(handoff.final_readiness_summary.evidence_bundle.all_artifacts_scope_matches === false, "blocked handoff must summarize bundle scope gate");

  const invalid = structuredClone(handoff);
  invalid.execution_groups[0].requires_confirmation = false;
  assertThrows(() => validateAwsDevUatOperatorHandoff(invalid), "must require confirmation");

  const invalidReady = structuredClone(handoff);
  invalidReady.aws_ready = true;
  assertThrows(() => validateAwsDevUatOperatorHandoff(invalidReady), "AWS ready mismatch");

  console.log("AWS dev/UAT operator handoff fixture check passed");
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}

function assertThrows(fn, message) {
  try {
    fn();
  } catch (error) {
    assert(String(error.message).includes(message), `expected error to include ${message}: ${error.message}`);
    return;
  }
  throw new Error(`expected function to throw: ${message}`);
}
