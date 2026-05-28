import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { buildAwsDevUatPreflightRawInput } from "./aws-dev-uat-preflight-raw-input-materializer.js";
import { buildAwsDevUatRawInputScaffolds } from "./aws-dev-uat-raw-input-scaffold.js";
import { buildAwsDevUatValidationRawInput } from "./aws-dev-uat-validation-raw-input-materializer.js";
import { checkAwsDevUatEvidenceBundle } from "./aws-dev-uat-evidence-bundle.js";
import { buildAwsDevUatPreflightEvidence, buildAwsDevUatValidationEvidence } from "./aws-dev-uat-evidence-builders.js";
import { buildAwsDevUatExecutionBridge } from "./aws-dev-uat-execution-bridge.js";
import { assert, readJson } from "./lib.js";

const tmpRoot = mkdtempSync(join(tmpdir(), "saphnexa-aws-dev-uat-materialized-flow-"));
const sampleAccountId = ["123456", "789012"].join("");
const capturedAt = "2026-05-28T14:51:00+09:00";
const gitTag = "v0.17.0-uat.20260528";
const githubReleaseUrl = "https://github.com/tsuji-tomonori/saphnexa/releases/tag/v0.17.0-uat.20260528";

try {
  const scaffolds = buildAwsDevUatRawInputScaffolds({
    planOutputPath: join(tmpRoot, "raw-capture-plan.json"),
    preflightOutputPath: join(tmpRoot, "preflight.scaffold.json"),
    validationOutputPath: join(tmpRoot, "validation.scaffold.json"),
    runId: "materialized-flow-check"
  });
  copyPreflightRawOutputs(dirname(scaffolds.preflight_path));
  writeValidationRawOutputs(scaffolds.validation_path);

  const preflightRawInputPath = join(tmpRoot, "aws_dev_uat_preflight.raw.json");
  const validationRawInputPath = join(tmpRoot, "aws_dev_uat_validation.raw.json");
  const preflightRawInput = buildAwsDevUatPreflightRawInput({
    scaffoldPath: scaffolds.preflight_path,
    outputPath: preflightRawInputPath,
    capturedAt,
    gitTag,
    githubReleaseUrl
  });
  const validationRawInput = buildAwsDevUatValidationRawInput({
    scaffoldPath: scaffolds.validation_path,
    outputPath: validationRawInputPath,
    capturedAt,
    gitTag,
    githubReleaseUrl,
    awsAccountId: sampleAccountId
  });
  assert(preflightRawInput.aws.account_id_parts.join("") === sampleAccountId, "preflight raw input account mismatch");
  assert(validationRawInput.e2e.passed_flows === validationRawInput.e2e.total_flows, "validation raw input E2E must pass");

  const preflightEvidencePath = join(tmpRoot, "aws_dev_uat_preflight.json");
  const validationEvidencePath = join(tmpRoot, "aws_dev_uat_validation.json");
  const executionBridgePath = join(tmpRoot, "aws_dev_uat_execution_bridge.json");
  const manifestPath = join(tmpRoot, "aws_dev_uat_evidence_bundle_manifest.json");
  buildAwsDevUatPreflightEvidence(preflightRawInputPath, preflightEvidencePath);
  buildAwsDevUatValidationEvidence(validationRawInputPath, validationEvidencePath);
  buildAwsDevUatExecutionBridge(executionBridgePath);

  const manifest = checkAwsDevUatEvidenceBundle({
    preflightRawInputPath,
    validationRawInputPath,
    preflightEvidencePath,
    validationEvidencePath,
    executionBridgePath,
    outputPath: manifestPath,
    allowFixtureText: true
  });
  assert(manifest.artifacts.some((item) => item.kind === "raw-input" && item.mode === "preflight"), "bundle must include preflight raw input");
  assert(manifest.artifacts.some((item) => item.kind === "raw-input" && item.mode === "validation"), "bundle must include validation raw input");
  assert(manifest.artifacts.some((item) => item.kind === "raw-output" && item.mode === "preflight"), "bundle must include preflight raw outputs");
  assert(manifest.artifacts.some((item) => item.kind === "raw-output" && item.mode === "validation"), "bundle must include validation raw outputs");
  assert(manifest.artifacts.some((item) => item.kind === "final-evidence" && item.mode === "preflight"), "bundle must include preflight final evidence");
  assert(manifest.artifacts.some((item) => item.kind === "final-evidence" && item.mode === "validation"), "bundle must include validation final evidence");
  assert(manifest.artifacts.some((item) => item.kind === "execution-bridge"), "bundle must include execution bridge artifact");
  assert(manifest.checks.preflight_final_gate === "passed", "preflight final gate must pass");
  assert(manifest.checks.validation_rag_quality_suite === "passed", "validation RAG quality suite must pass");

  assertThrows(
    () => checkAwsDevUatEvidenceBundle({
      preflightRawInputPath: join(tmpRoot, "missing-preflight.raw.json"),
      validationRawInputPath,
      preflightEvidencePath,
      validationEvidencePath,
      allowFixtureText: true
    }),
    "bundle artifact missing"
  );

  const missingRawOutputRoot = mkdtempSync(join(tmpdir(), "saphnexa-aws-dev-uat-materialized-missing-output-"));
  try {
    const missingScaffolds = buildAwsDevUatRawInputScaffolds({
      planOutputPath: join(missingRawOutputRoot, "raw-capture-plan.json"),
      preflightOutputPath: join(missingRawOutputRoot, "preflight.scaffold.json"),
      validationOutputPath: join(missingRawOutputRoot, "validation.scaffold.json"),
      runId: "materialized-flow-check"
    });
    copyPreflightRawOutputs(dirname(missingScaffolds.preflight_path), { skip: "raw/flyway-info.json" });
    assertThrows(
      () => buildAwsDevUatPreflightRawInput({
        scaffoldPath: missingScaffolds.preflight_path,
        outputPath: join(missingRawOutputRoot, "preflight.raw.json"),
        capturedAt,
        gitTag,
        githubReleaseUrl
      }),
      "flyway-info raw output missing"
    );
  } finally {
    rmSync(missingRawOutputRoot, { recursive: true, force: true });
  }

  console.log("AWS dev/UAT materialized evidence flow fixture check passed");
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}

function copyPreflightRawOutputs(root, options = {}) {
  for (const file of [
    "raw/aws-sts-get-caller-identity.json",
    "raw/cloudformation-describe-stacks.json",
    "raw/cloudformation-list-stack-resources.json",
    "raw/flyway-info.json",
    "raw/openapi.json",
    "raw/edge-realtime-smoke.json",
    "raw/rag-runtime-smoke.json",
    "raw/admin-artifacts-smoke.json"
  ]) {
    if (options.skip === file) continue;
    writeText(join(root, file), readFileSync(join("docs/acceptance/evidence", file), "utf8"));
  }
}

function writeValidationRawOutputs(scaffoldPath) {
  writeByCommand(scaffoldPath, "e2e-allure", {
    schema_version: "saphnexa-aws-dev-uat-e2e-result.raw.v1",
    environment: "uat",
    run_id: "materialized-flow-check",
    status: "captured",
    passed_flows: 6,
    total_flows: 6,
    pass_rate: 1,
    allure_run_url: "https://reports.uat.saphnexa.awsapps.com/admin/test-reports/allure/runs/run-20260528/",
    cloudfront_access_log_s3_uri: "s3://saphnexa-uat-logs/cloudfront/run-20260528/",
    scenarios: [
      { id: "general-user-chat", status: "passed", role: "general_user" },
      { id: "shared-chat-permission", status: "passed", role: "general_user" },
      { id: "admin-document-registration", status: "passed", role: "admin" },
      { id: "admin-evaluation-run", status: "passed", role: "admin" },
      { id: "admin-docs-artifact-view", status: "passed", role: "admin" },
      { id: "admin-allure-artifact-view", status: "passed", role: "admin" }
    ]
  });
  writeByCommand(scaffoldPath, "cloudfront-access-log", "2026-05-28 14:51:00 12345 E1234567890 cloudfront/run-20260528/access.log\n");
  writeByCommand(scaffoldPath, "performance-report", {
    schema_version: "saphnexa-aws-dev-uat-performance-result.raw.v1",
    environment: "uat",
    run_id: "materialized-flow-check",
    status: "captured",
    load_profile: "50 dau / 10 questions per user per day",
    non_ai_api_p95_ms: 500,
    error_rate: 0.001,
    question_start_p95_ms: 1200,
    rag_first_notice_p95_ms: 3000,
    final_answer_p95_ms: 40000,
    timeout_rate: 0.001,
    report_url: "https://reports.uat.saphnexa.awsapps.com/admin/evaluation-reports/performance/run-20260528/",
    cloudwatch_dashboard_url: "https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#dashboards:name=saphnexa-uat"
  });
  writeByCommand(scaffoldPath, "cloudwatch-dashboard", {
    DashboardName: "saphnexa-uat",
    DashboardArn: arn("cloudwatch", "dashboard/saphnexa-uat")
  });
  writeByCommand(scaffoldPath, "rag-quality-report", {
    schema_version: "saphnexa-aws-dev-uat-rag-quality-result.raw.v1",
    environment: "uat",
    run_id: "materialized-flow-check",
    status: "captured",
    golden_dataset: "saphnexa-golden-v017",
    evaluation_job_id: "rag-eval-run-20260528",
    bedrock_evaluation_job_arn: arn("bedrock", "evaluation-job/rag-eval-run-20260528"),
    recall_at_10: 0.9,
    citation_precision: 0.94,
    groundedness: 0.95,
    refusal_accuracy: 0.96,
    unsupported_claim_rate: 0.01,
    report_url: "https://reports.uat.saphnexa.awsapps.com/admin/evaluation-reports/rag-quality/run-20260528/"
  });
  writeByCommand(scaffoldPath, "bedrock-evaluation-job", {
    jobIdentifier: "rag-eval-run-20260528",
    jobArn: arn("bedrock", "evaluation-job/rag-eval-run-20260528"),
    status: "Completed"
  });
}

function writeByCommand(scaffoldPath, id, body) {
  const scaffold = readJson(scaffoldPath);
  const command = scaffold.capture_provenance.commands.find((item) => item.id === id);
  assert(command, `missing command ${id}`);
  const outputPath = resolve(dirname(scaffoldPath), command.output_ref);
  const text = typeof body === "string" ? body : `${JSON.stringify(body, null, 2)}\n`;
  writeText(outputPath, text);
}

function writeText(path, body) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}

function arn(service, resource) {
  const region = service === "cloudwatch" ? "" : "ap-northeast-1";
  return `arn:aws:${service}:${region}:${sampleAccountId}:${resource}`;
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
