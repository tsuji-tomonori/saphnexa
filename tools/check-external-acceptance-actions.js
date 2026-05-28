import { existsSync } from "node:fs";
import { externalActionPlanPath, requiredExternalActionIds } from "./external-acceptance-actions.js";
import { assert, isCurrentJstTimestamp, readJson, readText } from "./lib.js";

assert(existsSync(externalActionPlanPath), `external action plan missing: ${externalActionPlanPath}`);

const plan = readJson(externalActionPlanPath);
const unresolvedTraceIds = parseTraceRows(readText("docs/acceptance/traceability.md"))
  .filter((row) => row.state !== "local_verified")
  .map((row) => row.id);

assert(plan.schema_version === "saphnexa-external-acceptance-action-plan.v1", "external action plan schema mismatch");
assert(isCurrentJstTimestamp(plan.generated_at), "external action plan generated_at must be current JST timestamp");
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
const awsDeployPublish = plan.actions.find((action) => action.id === "aws-deploy-publish");
assert(awsDeployPublish.candidate_commands.includes("aws s3 sync dist/admin/docs/latest/ s3://<admin-artifacts-bucket>/docs-site/latest/"), "docs latest publish command must use design docs-site/latest prefix");
assert(awsDeployPublish.candidate_commands.includes("aws s3 sync dist/admin/docs/versions/v0.16/ s3://<admin-artifacts-bucket>/docs-site/releases/v0.16/"), "docs version publish command must use design docs-site/releases/v0.16 prefix");
assert(awsDeployPublish.candidate_commands.includes("aws s3 sync dist/admin/docs/versions/v0.17/ s3://<admin-artifacts-bucket>/docs-site/releases/v0.17/"), "docs version publish command must use design docs-site/releases/v0.17 prefix");
assert(awsDeployPublish.candidate_commands.includes("aws s3 sync dist/admin/test-reports/allure/latest/ s3://<admin-artifacts-bucket>/test-reports/allure/latest/"), "Allure latest publish command must use test-reports/allure/latest prefix");
assert(awsDeployPublish.candidate_commands.includes("aws s3 sync dist/admin/test-reports/allure/runs/<test_run_id>/ s3://<admin-artifacts-bucket>/test-reports/allure/runs/<test_run_id>/"), "Allure run publish command must use test-reports/allure/runs prefix");
assert(!awsDeployPublish.candidate_commands.includes("aws s3 sync dist/admin/docs/ s3://<admin-artifacts-bucket>/docs/"), "docs publish command must not use legacy docs/ prefix");
const cloudFormationCapture = plan.actions.find((action) => action.id === "cloudformation-capture");
assert(cloudFormationCapture.candidate_commands.includes("CFN_CAPTURED_AT=<capture-iso-timestamp> npm run cfn:inventory:normalize"), "CloudFormation capture action must include final inventory normalizer command");
const awsDevUatValidation = plan.actions.find((action) => action.id === "aws-dev-uat-validation");
assert(awsDevUatValidation.acceptance_ids.includes("AC-098"), "AWS dev/UAT validation action must cover RAG quality");
assert(awsDevUatValidation.acceptance_ids.includes("AC-123"), "AWS dev/UAT validation action must cover E2E");
const e2eCaptureCommand = "node tools/capture-aws-dev-uat-e2e-result.js --env uat --run-id <run-id> > raw/e2e-allure-run.json";
const perfCaptureCommand = "node tools/capture-aws-dev-uat-performance-result.js --env uat --run-id <run-id> > raw/performance-report.json";
const ragCaptureCommand = "node tools/capture-aws-dev-uat-rag-quality-result.js --env uat --run-id <run-id> > raw/rag-quality-report.json";
const validationMaterializeCommand = "npm run aws:dev-uat:validation-raw-input:build -- --scaffold dist/acceptance/raw/aws_dev_uat_validation.raw.scaffold.json --output <raw-validation-input.json> --captured-at <capture-jst-timestamp> --git-tag <release-tag> --github-release-url <github-release-url> --aws-account-id <aws-account-id>";
for (const command of [
  "npm run aws:dev-uat:execution-bridge:probe",
  "npm run aws:dev-uat:raw-capture-plan:build",
  "npm run aws:dev-uat:raw-capture-plan:check",
  "npm run aws:dev-uat:raw-input-scaffold:build",
  "npm run aws:dev-uat:raw-input-scaffold:check",
  "npm run aws:dev-uat:capture-helpers:check",
  "npm run aws:dev-uat:raw-output:check -- preflight --input <raw-preflight-input.json>",
  "npm run aws:dev-uat:raw-input:check -- preflight --input <raw-preflight-input.json>",
  "npm run aws:dev-uat:preflight:build -- --input <raw-preflight-input.json>",
  "npm run aws:dev-uat:preflight:final",
  e2eCaptureCommand,
  "aws s3 ls s3://saphnexa-uat-logs/cloudfront/<run-id>/ --region ap-northeast-1 > raw/cloudfront-access-log-list.txt",
  perfCaptureCommand,
  "aws cloudwatch get-dashboard --dashboard-name saphnexa-uat --region ap-northeast-1 > raw/cloudwatch-dashboard.json",
  ragCaptureCommand,
  "aws bedrock get-evaluation-job --job-identifier rag-eval-<run-id> --region ap-northeast-1 > raw/bedrock-evaluation-job.json",
  validationMaterializeCommand,
  "npm run aws:dev-uat:raw-output:check -- validation --input <raw-validation-input.json>",
  "npm run aws:dev-uat:raw-input:check -- validation --input <raw-validation-input.json>",
  "npm run aws:dev-uat:validation:build -- --input <raw-validation-input.json>",
  "npm run test:e2e:aws",
  "npm run perf:aws",
  "npm run rag:quality:aws",
  "npm run aws:dev-uat:validation:final",
  "npm run aws:dev-uat:evidence-bundle:check -- --preflight-raw-input <raw-preflight-input.json> --validation-raw-input <raw-validation-input.json> --preflight-evidence dist/acceptance/aws_dev_uat_preflight.json --validation-evidence dist/acceptance/aws_dev_uat_validation.json --execution-bridge dist/acceptance/aws_dev_uat_execution_bridge.json --output dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json"
]) {
  assert(awsDevUatValidation.candidate_commands.includes(command), `AWS dev/UAT validation action missing ${command}`);
}
assert(
  awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:raw-capture-plan:check") <
    awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:raw-input-scaffold:build"),
  "AWS dev/UAT validation action must verify raw capture plan before building raw input scaffold"
);
assert(
  awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:raw-input-scaffold:check") <
    awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:raw-output:check -- preflight --input <raw-preflight-input.json>"),
  "AWS dev/UAT validation action must verify raw input scaffold before checking preflight raw outputs"
);
assert(
  awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:raw-output:check -- preflight --input <raw-preflight-input.json>") <
    awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:raw-input:check -- preflight --input <raw-preflight-input.json>"),
  "AWS dev/UAT validation action must check preflight raw outputs before dry-running preflight raw input"
);
assert(
  awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:raw-input:check -- preflight --input <raw-preflight-input.json>") <
    awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:preflight:build -- --input <raw-preflight-input.json>"),
  "AWS dev/UAT validation action must dry-run preflight raw input before building preflight evidence"
);
assert(
  e2eCaptureCommand &&
    awsDevUatValidation.candidate_commands.indexOf(e2eCaptureCommand) <
    awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:raw-output:check -- validation --input <raw-validation-input.json>"),
  "AWS dev/UAT validation action must capture E2E result before checking validation raw outputs"
);
assert(
  perfCaptureCommand &&
    awsDevUatValidation.candidate_commands.indexOf(perfCaptureCommand) <
    awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:raw-output:check -- validation --input <raw-validation-input.json>"),
  "AWS dev/UAT validation action must capture performance result before checking validation raw outputs"
);
assert(
  ragCaptureCommand &&
    awsDevUatValidation.candidate_commands.indexOf(ragCaptureCommand) <
    awsDevUatValidation.candidate_commands.indexOf(validationMaterializeCommand),
  "AWS dev/UAT validation action must capture RAG quality result before checking validation raw outputs"
);
assert(
  awsDevUatValidation.candidate_commands.indexOf(validationMaterializeCommand) <
    awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:raw-output:check -- validation --input <raw-validation-input.json>"),
  "AWS dev/UAT validation action must materialize validation raw input before checking validation raw outputs"
);
assert(
  awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:raw-output:check -- validation --input <raw-validation-input.json>") <
    awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:raw-input:check -- validation --input <raw-validation-input.json>"),
  "AWS dev/UAT validation action must check validation raw outputs before dry-running validation raw input"
);
assert(
  awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:raw-input:check -- validation --input <raw-validation-input.json>") <
    awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:validation:build -- --input <raw-validation-input.json>"),
  "AWS dev/UAT validation action must dry-run validation raw input before building validation evidence"
);
for (const command of ["npm run test:e2e:aws", "npm run perf:aws", "npm run rag:quality:aws"]) {
  assert(
    awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:validation:build -- --input <raw-validation-input.json>") <
      awsDevUatValidation.candidate_commands.indexOf(command),
    `${command} must run after validation evidence build`
  );
}
assert(
  awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:validation:final") <
    awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:evidence-bundle:check -- --preflight-raw-input <raw-preflight-input.json> --validation-raw-input <raw-validation-input.json> --preflight-evidence dist/acceptance/aws_dev_uat_preflight.json --validation-evidence dist/acceptance/aws_dev_uat_validation.json --execution-bridge dist/acceptance/aws_dev_uat_execution_bridge.json --output dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json"),
  "AWS dev/UAT validation action must check evidence bundle after validation final gate"
);
assert(
  awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:capture-helpers:check") <
    awsDevUatValidation.candidate_commands.indexOf("npm run aws:dev-uat:preflight:build -- --input <raw-preflight-input.json>"),
  "AWS dev/UAT validation action must verify capture helpers before building preflight evidence"
);
assert(awsDevUatValidation.evidence_outputs.includes("dist/acceptance/aws_dev_uat_execution_bridge.json"), "AWS dev/UAT validation action must output execution bridge snapshot");
assert(awsDevUatValidation.evidence_outputs.includes("dist/acceptance/aws_dev_uat_raw_capture_plan.json"), "AWS dev/UAT validation action must output raw capture plan");
assert(awsDevUatValidation.evidence_outputs.includes("dist/acceptance/raw/aws_dev_uat_preflight.raw.scaffold.json"), "AWS dev/UAT validation action must output preflight raw input scaffold");
assert(awsDevUatValidation.evidence_outputs.includes("dist/acceptance/raw/aws_dev_uat_validation.raw.scaffold.json"), "AWS dev/UAT validation action must output validation raw input scaffold");
assert(awsDevUatValidation.evidence_outputs.includes("dist/acceptance/aws_dev_uat_preflight.json"), "AWS dev/UAT validation action must output preflight evidence");
assert(awsDevUatValidation.evidence_outputs.includes("dist/acceptance/aws_dev_uat_validation.json"), "AWS dev/UAT validation action must output validation evidence");
assert(awsDevUatValidation.evidence_outputs.includes("dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json"), "AWS dev/UAT validation action must output evidence bundle manifest");
const defectSnapshotRefresh = plan.actions.find((action) => action.id === "defect-snapshot-refresh");
assert(defectSnapshotRefresh.acceptance_ids.includes("AC-153"), "defect snapshot refresh action must cover AC-153");
assert(defectSnapshotRefresh.candidate_commands.includes("gh issue list --state open --json number,title,labels,state"), "defect snapshot refresh action must include GitHub issue list command");
assert(defectSnapshotRefresh.evidence_outputs.includes("docs/acceptance/defects/open_issues_snapshot.json"), "defect snapshot refresh action must output defect snapshot");
const finalEvidenceCandidate = plan.actions.find((action) => action.id === "final-evidence-candidate");
assert(finalEvidenceCandidate.acceptance_ids.includes("AC-153"), "final evidence candidate action must include AC-153");
assert(finalEvidenceCandidate.required_before_run.includes("fresh defect snapshot"), "final evidence candidate action must require fresh defect snapshot");
assert(finalEvidenceCandidate.candidate_commands.includes("npm run acceptance:final-manifest:build"), "final evidence candidate action must include manifest builder command");
assert(finalEvidenceCandidate.candidate_commands.includes("npm run acceptance:final-checklist:build"), "final evidence candidate action must include checklist builder command");
assert(
  finalEvidenceCandidate.candidate_commands.indexOf("npm run acceptance:final-manifest:build") <
    finalEvidenceCandidate.candidate_commands.indexOf("npm run acceptance:final-candidate:check"),
  "final evidence candidate action must build manifest before checking candidate"
);
assert(
  finalEvidenceCandidate.candidate_commands.indexOf("npm run acceptance:final-checklist:build") <
    finalEvidenceCandidate.candidate_commands.indexOf("npm run acceptance:final-candidate:check"),
  "final evidence candidate action must build checklist before checking candidate"
);
assert(plan.pending_action_ids.length === plan.actions.length, "all actions must be pending before external execution");
assert(plan.note.includes("require explicit confirmation"), "external action confirmation note missing");

console.log("external acceptance action plan check passed");

function parseTraceRows(body) {
  return [...body.matchAll(/^\| (AC-\d{3}) \| ([a-z_]+) \| (.+) \|$/gm)]
    .map((match) => ({ id: match[1], state: match[2], evidence: match[3] }));
}
