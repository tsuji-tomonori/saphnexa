import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildAwsDevUatOperatorInputScaffold } from "./aws-dev-uat-operator-input.js";
import { validateAwsDevUatOperatorInput } from "./check-aws-dev-uat-operator-input.js";
import { assert } from "./lib.js";

const tmpRoot = mkdtempSync(join(tmpdir(), "saphnexa-aws-dev-uat-operator-input-"));
const scaffold = buildAwsDevUatOperatorInputScaffold({
  outputPath: join(tmpRoot, "aws_dev_uat_operator_input.scaffold.json"),
  rawCapturePlanPath: join(tmpRoot, "aws_dev_uat_raw_capture_plan.json")
});

validateAwsDevUatOperatorInput(scaffold);
assertThrows(() => validateAwsDevUatOperatorInput(scaffold, { requireResolved: true }), "scaffold must not pass resolved input check");

const resolved = resolvedInput(scaffold);
validateAwsDevUatOperatorInput(resolved, { requireResolved: true });

assertThrows(
  () => validateAwsDevUatOperatorInput({ ...resolved, aws: { ...resolved.aws, account_id: "123456" } }, { requireResolved: true }),
  "invalid AWS account must fail"
);
assertThrows(
  () => validateAwsDevUatOperatorInput({ ...resolved, release: { ...resolved.release, git_tag: "<release-tag>" } }, { requireResolved: true }),
  "placeholder git tag must fail"
);
assertThrows(
  () => validateAwsDevUatOperatorInput({ ...resolved, release: { ...resolved.release, github_release_url: "https://example.com/releases/v0.17.0" } }, { requireResolved: true }),
  "non GitHub release URL must fail"
);
assertThrows(
  () => validateAwsDevUatOperatorInput({ ...resolved, publish: { ...resolved.publish, docs_latest_s3_uri: "s3://<admin-artifacts-bucket>/docs-site/latest/" } }, { requireResolved: true }),
  "unresolved S3 URI must fail"
);

console.log("AWS dev/UAT operator input fixture check passed");

function resolvedInput(input) {
  const copy = JSON.parse(JSON.stringify(input));
  const gitTag = "v0.17.0";
  const releaseUrl = "https://github.com/tsuji-tomonori/saphnexa/releases/tag/v0.17.0";
  const accountId = ["123456", "789012"].join("");
  const bucket = "saphnexa-uat-123456789012-artifacts";
  const testRunId = "uat-run-20260528-1539";
  const capturedAt = "2026-05-28T15:39:00+09:00";
  copy.input_status = "ready_for_aws_dev_uat_execution";
  copy.final_input = true;
  copy.operator = {
    reviewer: "acceptance-operator",
    approved_execution_window_jst: "2026-05-28T16:00:00+09:00"
  };
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
  let thrown = false;
  try {
    fn();
  } catch {
    thrown = true;
  }
  assert(thrown, message);
}
