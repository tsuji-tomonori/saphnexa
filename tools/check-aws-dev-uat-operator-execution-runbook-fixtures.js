import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildExternalAcceptanceActionPlan } from "./external-acceptance-actions.js";
import { buildAwsDevUatRawCapturePlan } from "./aws-dev-uat-raw-capture-plan.js";
import { buildAwsDevUatOperatorInputScaffold } from "./aws-dev-uat-operator-input.js";
import { buildAwsDevUatOperatorExecutionRunbook } from "./aws-dev-uat-operator-execution-runbook.js";
import { validateAwsDevUatOperatorExecutionRunbook } from "./check-aws-dev-uat-operator-execution-runbook.js";
import { assert } from "./lib.js";

const tmpRoot = mkdtempSync(join(tmpdir(), "saphnexa-aws-dev-uat-operator-runbook-"));

try {
  const externalActionPlan = buildExternalAcceptanceActionPlan(join(tmpRoot, "external_action_plan.json"));
  const rawCapturePlan = buildAwsDevUatRawCapturePlan({
    outputPath: join(tmpRoot, "aws_dev_uat_raw_capture_plan.json"),
    captureRoot: join(tmpRoot, "raw"),
    runId: "uat-run-20260528-1610"
  });
  const scaffold = buildAwsDevUatOperatorInputScaffold({
    outputPath: join(tmpRoot, "aws_dev_uat_operator_input.scaffold.json"),
    rawCapturePlan,
    rawCapturePlanPath: join(tmpRoot, "aws_dev_uat_raw_capture_plan.json")
  });

  const blocked = buildAwsDevUatOperatorExecutionRunbook({
    outputPath: join(tmpRoot, "aws_dev_uat_operator_execution_runbook.blocked.json"),
    externalActionPlan,
    externalActionPlanPath: "dist/acceptance/external_action_plan.json",
    rawCapturePlan,
    rawCapturePlanPath: "dist/acceptance/aws_dev_uat_raw_capture_plan.json",
    operatorInput: scaffold,
    operatorInputPath: "dist/acceptance/aws_dev_uat_operator_input.scaffold.json"
  });
  validateAwsDevUatOperatorExecutionRunbook(blocked);
  assert(blocked.ready_for_external_execution === false, "scaffold runbook must not be ready");
  assertThrows(() => validateAwsDevUatOperatorExecutionRunbook(blocked, { requireResolved: true }), "is not ready");

  const ready = buildAwsDevUatOperatorExecutionRunbook({
    outputPath: join(tmpRoot, "aws_dev_uat_operator_execution_runbook.ready.json"),
    externalActionPlan,
    externalActionPlanPath: "dist/acceptance/external_action_plan.json",
    rawCapturePlan,
    rawCapturePlanPath: "dist/acceptance/aws_dev_uat_raw_capture_plan.json",
    operatorInput: resolvedInput(scaffold),
    operatorInputPath: "dist/acceptance/aws_dev_uat_operator_input.json"
  });
  validateAwsDevUatOperatorExecutionRunbook(ready, { requireResolved: true });
  assert(ready.ready_for_external_execution === true, "resolved runbook must be ready for external execution");
  assert(ready.phases.every((phase) => phase.requires_confirmation === true), "all ready phases must require confirmation");
  assert(ready.phases.flatMap((phase) => phase.commands).every((command) => command.resolved === true), "all ready commands must be resolved");
  const validationCommands = ready.phases.find((phase) => phase.id === "validation_materialization").commands.map((command) => command.command);
  assert(validationCommands.includes("npm run test:e2e:aws"), "ready runbook must include AWS E2E suite gate");
  assert(validationCommands.includes("npm run perf:aws"), "ready runbook must include AWS performance suite gate");
  assert(validationCommands.includes("npm run rag:quality:aws"), "ready runbook must include AWS RAG quality suite gate");
  assert(
    validationCommands.indexOf("npm run rag:quality:aws") < validationCommands.indexOf("npm run aws:dev-uat:validation:final"),
    "ready runbook must run suite gates before validation final gate"
  );

  const placeholder = structuredClone(ready);
  placeholder.phases.find((phase) => phase.id === "deploy_publish").commands[1].command = "aws s3 sync dist/admin/docs/latest/ s3://<bucket>/docs-site/latest/";
  assertThrows(() => validateAwsDevUatOperatorExecutionRunbook(placeholder, { requireResolved: true }), "contains unresolved value");

  const noConfirmation = structuredClone(ready);
  noConfirmation.phases.find((phase) => phase.id === "deploy_publish").requires_confirmation = false;
  assertThrows(() => validateAwsDevUatOperatorExecutionRunbook(noConfirmation, { requireResolved: true }), "must require confirmation");

  const orderBroken = structuredClone(ready);
  orderBroken.phase_order = [
    "release",
    "deploy_publish",
    "preflight_capture",
    "preflight_materialization",
    "validation_capture",
    "final_gates",
    "validation_materialization",
    "final_acceptance"
  ];
  assertThrows(() => validateAwsDevUatOperatorExecutionRunbook(orderBroken, { requireResolved: true }), "phase order mismatch");

  console.log("AWS dev/UAT operator execution runbook fixture check passed");
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}

function resolvedInput(input) {
  const copy = JSON.parse(JSON.stringify(input));
  const gitTag = "v0.17.0";
  const releaseUrl = "https://github.com/tsuji-tomonori/saphnexa/releases/tag/v0.17.0";
  const accountId = ["123456", "789012"].join("");
  const bucket = "saphnexa-uat-123456789012-artifacts";
  const testRunId = "uat-run-20260528-1610";
  const capturedAt = "2026-05-28T16:10:00+09:00";
  copy.input_status = "ready_for_aws_dev_uat_execution";
  copy.final_input = true;
  copy.operator = {
    reviewer: "acceptance-operator",
    approved_execution_window_jst: "2026-05-28T16:30:00+09:00"
  };
  copy.runtime.run_id = testRunId;
  copy.release = {
    commit_sha: input.git_commit_sha,
    git_tag: gitTag,
    github_release_url: releaseUrl
  };
  copy.aws.account_id = accountId;
  copy.publish = {
    admin_artifacts_bucket: bucket,
    docs_latest_s3_uri: `s3://${bucket}/docs-site/latest/`,
    docs_v017_s3_uri: `s3://${bucket}/docs-site/releases/v0.17/`,
    allure_latest_s3_uri: `s3://${bucket}/test-reports/allure/latest/`,
    allure_run_s3_uri: `s3://${bucket}/test-reports/allure/runs/${testRunId}/`
  };
  copy.validation = {
    test_run_id: testRunId,
    golden_dataset_id: "golden-v0.17",
    rag_evaluation_run_id: `rag-eval-${testRunId}`,
    bedrock_evaluation_job_arn: `arn:aws:bedrock:ap-northeast-1:${accountId}:evaluation-job/rag-eval-${testRunId}`,
    e2e_allure_run_url: `https://artifacts.uat.saphnexa.awsapps.com/test-reports/allure/runs/${testRunId}/`,
    performance_report_url: `https://artifacts.uat.saphnexa.awsapps.com/performance/${testRunId}.json`,
    rag_quality_report_url: `https://artifacts.uat.saphnexa.awsapps.com/rag-quality/${testRunId}.json`
  };
  copy.resolved_commands = {
    resolved_operator_input_check: copy.command_templates.resolved_operator_input_check,
    preflight_materialize: copy.command_templates.preflight_materialize
      .replace("<capture-jst-timestamp>", capturedAt)
      .replace("<release-tag>", gitTag)
      .replace("<github-release-url>", releaseUrl),
    validation_materialize: copy.command_templates.validation_materialize
      .replace("<capture-jst-timestamp>", capturedAt)
      .replace("<release-tag>", gitTag)
      .replace("<github-release-url>", releaseUrl)
      .replace("<aws-account-id>", accountId),
    evidence_bundle: copy.command_templates.evidence_bundle
      .replaceAll("<raw-preflight-input.json>", copy.raw_inputs.preflight_raw_input_path)
      .replaceAll("<raw-validation-input.json>", copy.raw_inputs.validation_raw_input_path),
    final_readiness: copy.command_templates.final_readiness
  };
  return copy;
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
