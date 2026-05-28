import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { buildAwsDevUatRawInputScaffolds } from "./aws-dev-uat-raw-input-scaffold.js";
import { buildAwsDevUatValidationRawInput } from "./aws-dev-uat-validation-raw-input-materializer.js";
import { checkAwsDevUatRawInput } from "./aws-dev-uat-raw-input-checker.js";
import { checkAwsDevUatRawOutputs } from "./aws-dev-uat-raw-output-checker.js";
import { assert, readJson } from "./lib.js";

const tmpRoot = mkdtempSync(join(tmpdir(), "saphnexa-aws-dev-uat-validation-raw-input-"));
const sampleAccountId = ["123456", "789012"].join("");

try {
  const scaffolds = buildAwsDevUatRawInputScaffolds({
    planOutputPath: join(tmpRoot, "raw-capture-plan.json"),
    preflightOutputPath: join(tmpRoot, "preflight.scaffold.json"),
    validationOutputPath: join(tmpRoot, "validation.scaffold.json"),
    runId: "validation-raw-input-check"
  });
  writeValidationRawOutputs(scaffolds.validation_path);

  const outputPath = join(tmpRoot, "aws_dev_uat_validation.raw.json");
  const rawInput = buildAwsDevUatValidationRawInput({
    scaffoldPath: scaffolds.validation_path,
    outputPath,
    capturedAt: "2026-05-28T14:05:00+09:00",
    gitTag: "v0.17.0-uat.20260528",
    githubReleaseUrl: "https://github.com/tsuji-tomonori/saphnexa/releases/tag/v0.17.0-uat.20260528",
    awsAccountId: sampleAccountId
  });
  const written = readJson(outputPath);
  assert(JSON.stringify(rawInput) === JSON.stringify(written), "written validation raw input must match returned raw input");
  assert(written.e2e.scenario_count === 6, "materialized E2E scenario_count mismatch");
  assert(written.performance.metrics.non_ai_api_p95_ms === 500, "materialized performance metric mismatch");
  assert(written.rag_quality.metrics.recall_at_10 === 0.9, "materialized RAG metric mismatch");
  checkAwsDevUatRawOutputs("validation", outputPath, { allowFixtureText: true });
  checkAwsDevUatRawInput("validation", outputPath);

  const missingRoot = join(tmpRoot, "missing-output");
  const missingScaffolds = buildAwsDevUatRawInputScaffolds({
    planOutputPath: join(missingRoot, "raw-capture-plan.json"),
    preflightOutputPath: join(missingRoot, "preflight.scaffold.json"),
    validationOutputPath: join(missingRoot, "validation.scaffold.json"),
    runId: "validation-raw-input-check"
  });
  assertThrows(
    () => buildAwsDevUatValidationRawInput({
      scaffoldPath: missingScaffolds.validation_path,
      outputPath: join(missingRoot, "validation.raw.json"),
      capturedAt: "2026-05-28T14:05:00+09:00",
      gitTag: "v0.17.0-uat.20260528",
      githubReleaseUrl: "https://github.com/tsuji-tomonori/saphnexa/releases/tag/v0.17.0-uat.20260528",
      awsAccountId: sampleAccountId
    }),
    "raw output missing"
  );

  const failingScaffold = join(tmpRoot, "threshold.scaffold.json");
  writeJson(failingScaffold, readJson(scaffolds.validation_path));
  writeValidationRawOutputs(failingScaffold, { nonAiApiP95Ms: 801 });
  assertThrows(
    () => buildAwsDevUatValidationRawInput({
      scaffoldPath: failingScaffold,
      outputPath: join(tmpRoot, "threshold.raw.json"),
      capturedAt: "2026-05-28T14:05:00+09:00",
      gitTag: "v0.17.0-uat.20260528",
      githubReleaseUrl: "https://github.com/tsuji-tomonori/saphnexa/releases/tag/v0.17.0-uat.20260528",
      awsAccountId: sampleAccountId
    }),
    "performance non-AI API p95"
  );

  console.log("AWS dev/UAT validation raw input materializer check passed");
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}

function writeValidationRawOutputs(scaffoldPath, options = {}) {
  const root = dirname(scaffoldPath);
  const nonAiApiP95Ms = options.nonAiApiP95Ms || 500;
  writeByCommand(scaffoldPath, "e2e-allure", {
    schema_version: "saphnexa-aws-dev-uat-e2e-result.raw.v1",
    environment: "uat",
    run_id: "validation-raw-input-check",
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
  writeByCommand(scaffoldPath, "cloudfront-access-log", "2026-05-28 14:05:00 12345 E1234567890 cloudfront/run-20260528/access.log\n");
  writeByCommand(scaffoldPath, "performance-report", {
    schema_version: "saphnexa-aws-dev-uat-performance-result.raw.v1",
    environment: "uat",
    run_id: "validation-raw-input-check",
    status: "captured",
    load_profile: "50 dau / 10 questions per user per day",
    non_ai_api_p95_ms: nonAiApiP95Ms,
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
    run_id: "validation-raw-input-check",
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

  function writeByCommand(path, id, body) {
    const scaffold = readJson(path);
    const command = scaffold.capture_provenance.commands.find((item) => item.id === id);
    assert(command, `missing command ${id}`);
    const outputPath = resolve(root, command.output_ref);
    mkdirSync(dirname(outputPath), { recursive: true });
    const text = typeof body === "string" ? body : `${JSON.stringify(body, null, 2)}\n`;
    writeFileSync(outputPath, text);
  }
}

function arn(service, resource) {
  const region = service === "cloudwatch" ? "" : "ap-northeast-1";
  return `arn:aws:${service}:${region}:${sampleAccountId}:${resource}`;
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
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
