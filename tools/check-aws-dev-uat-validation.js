import { existsSync } from "node:fs";
import { currentGitCommit } from "./git-context.js";
import { assert, readJson } from "./lib.js";

const allowedSuites = new Set(["all", "e2e", "performance", "rag-quality"]);

if (process.argv[1]?.endsWith("check-aws-dev-uat-validation.js")) {
  const args = process.argv.slice(2);
  const path = args.find((item) => !item.startsWith("--")) || "docs/acceptance/evidence/aws_dev_uat_validation.example.json";
  const requireFinal = args.includes("--require-final");
  const suiteArg = args.find((item) => item.startsWith("--suite="));
  const suite = suiteArg ? suiteArg.split("=")[1] : "all";

  validateAwsDevUatValidationEvidence(readJson(path), { path, requireFinal, suite });
  console.log(`AWS dev/UAT validation check passed: ${path}${requireFinal ? " (final)" : ""}${suite === "all" ? "" : ` suite=${suite}`}`);
}

export function validateAwsDevUatValidationEvidence(evidence, options = {}) {
  const path = options.path || "evidence";
  const requireFinal = options.requireFinal === true;
  const suite = options.suite || "all";
  const isFixture = evidence.evidence_class === "fixture";

  assert(allowedSuites.has(suite), `unknown suite: ${suite}`);
  assert(existsSync(path), `AWS dev/UAT validation evidence missing: ${path}`);
  assert(evidence.schema_version === "saphnexa-aws-dev-uat-validation.v1", "schema_version mismatch");
  assert(["fixture", "aws-captured"].includes(evidence.evidence_class), "evidence_class must be fixture or aws-captured");
  if (requireFinal) assert(!isFixture, "--require-final rejects fixture evidence");
  assert(["dev", "uat"].includes(evidence.environment), "environment must be dev or uat");
  assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/.test(evidence.captured_at || ""), "captured_at must be JST timestamp");
  assertSource(evidence.source, { requireFinal, isFixture });
  assertPreflight(evidence.preflight);
  if (suite === "all" || suite === "e2e") assertE2e(evidence.e2e, { isFixture });
  if (suite === "all" || suite === "performance") assertPerformance(evidence.performance, { isFixture });
  if (suite === "all" || suite === "rag-quality") assertRagQuality(evidence.rag_quality, { isFixture });
}

function assertSource(source, context) {
  assert(source && typeof source === "object", "source section is required");
  assert(/^[a-f0-9]{40}$/.test(source.git_commit_sha || ""), "source.git_commit_sha must be a 40 character hex SHA");
  if (context.requireFinal) assert(source.git_commit_sha === currentGitCommit(), "source.git_commit_sha must match current Git ref for final evidence");
  assertText(source.git_tag, "source.git_tag", context);
  assertHttpsUrl(source.github_release_url, "source.github_release_url", context);
  assert(source.github_release_url.endsWith(`/releases/tag/${encodeURIComponent(source.git_tag)}`), "source.github_release_url must match git_tag");
}

function assertPreflight(preflight) {
  assert(preflight && typeof preflight === "object", "preflight section is required");
  assert(preflight.status === "passed", "preflight.status must be passed");
  assert(preflight.command === "npm run aws:dev-uat:preflight:final", "preflight.command mismatch");
  assert(preflight.evidence_path === "dist/acceptance/aws_dev_uat_preflight.json", "preflight.evidence_path mismatch");
}

function assertE2e(e2e, context) {
  assert(e2e && typeof e2e === "object", "e2e section is required");
  assert(e2e.status === "passed", "e2e.status must be passed");
  assert(e2e.command === "npm run test:e2e:aws", "e2e.command mismatch");
  assert(e2e.scenario_count >= 6, "e2e.scenario_count must cover the 6 major E2E flows");
  assert(e2e.passed_count === e2e.scenario_count, "e2e.passed_count must equal scenario_count");
  assert(e2e.failed_count === 0, "e2e.failed_count must be 0");
  assert(e2e.pass_rate === 1, "e2e.pass_rate must be 1");
  assertAllureReportUrl(e2e.allure_report_url, "e2e.allure_report_url", context);
  assertS3Uri(e2e.cloudfront_access_log_s3_uri, "e2e.cloudfront_access_log_s3_uri", context);
  const scenarioIds = new Set((e2e.scenarios || []).map((item) => item.id));
  for (const id of [
    "general-user-chat",
    "shared-chat-permission",
    "admin-document-registration",
    "admin-evaluation-run",
    "admin-docs-artifact-view",
    "admin-allure-artifact-view"
  ]) {
    assert(scenarioIds.has(id), `e2e.scenarios missing ${id}`);
  }
  for (const scenario of e2e.scenarios || []) {
    assert(scenario.status === "passed", `e2e scenario must pass: ${scenario.id}`);
    assert(["general_user", "admin"].includes(scenario.role), `e2e scenario role mismatch: ${scenario.id}`);
  }
}

function assertPerformance(performance, context) {
  assert(performance && typeof performance === "object", "performance section is required");
  assert(performance.status === "passed", "performance.status must be passed");
  assert(performance.command === "npm run perf:aws", "performance.command mismatch");
  assertText(performance.load_profile, "performance.load_profile", context);
  assertEvaluationReportUrl(performance.report_url, "performance.report_url", context);
  assertHttpsUrl(performance.cloudwatch_dashboard_url, "performance.cloudwatch_dashboard_url", context);
  const metrics = performance.metrics || {};
  assertNumberAtMost(metrics.non_ai_api_p95_ms, 800, "performance.metrics.non_ai_api_p95_ms");
  assertNumberLessThan(metrics.non_ai_api_error_rate, 0.01, "performance.metrics.non_ai_api_error_rate");
  assertNumberAtMost(metrics.question_start_p95_ms, 2000, "performance.metrics.question_start_p95_ms");
  assertNumberAtMost(metrics.rag_first_notification_p95_ms, 5000, "performance.metrics.rag_first_notification_p95_ms");
  assertNumberAtMost(metrics.rag_final_answer_p95_ms, 60000, "performance.metrics.rag_final_answer_p95_ms");
  assertNumberLessThan(metrics.rag_timeout_rate, 0.02, "performance.metrics.rag_timeout_rate");
}

function assertRagQuality(ragQuality, context) {
  assert(ragQuality && typeof ragQuality === "object", "rag_quality section is required");
  assert(ragQuality.status === "passed", "rag_quality.status must be passed");
  assert(ragQuality.command === "npm run rag:quality:aws", "rag_quality.command mismatch");
  assertText(ragQuality.dataset_id, "rag_quality.dataset_id", context);
  assertText(ragQuality.evaluation_run_id, "rag_quality.evaluation_run_id", context);
  assertEvaluationReportUrl(ragQuality.report_url, "rag_quality.report_url", context);
  assertArn(ragQuality.bedrock_evaluation_job_arn, "rag_quality.bedrock_evaluation_job_arn", "bedrock", context);
  assert(JSON.stringify(ragQuality.metric_categories || []) === JSON.stringify(["retrieval", "generation", "end_to_end"]), "rag_quality.metric_categories mismatch");
  const metrics = ragQuality.metrics || {};
  assertNumberAtLeast(metrics.recall_at_10, 0.85, "rag_quality.metrics.recall_at_10");
  assertNumberAtLeast(metrics.citation_precision, 0.90, "rag_quality.metrics.citation_precision");
  assertNumberAtLeast(metrics.groundedness, 0.90, "rag_quality.metrics.groundedness");
  assertNumberAtLeast(metrics.refusal_accuracy, 0.95, "rag_quality.metrics.refusal_accuracy");
  assertNumberAtMost(metrics.unsupported_claim_rate, 0.02, "rag_quality.metrics.unsupported_claim_rate");
}

function assertText(value, label, context) {
  assert(typeof value === "string" && value.trim().length > 0, `${label} is required`);
  assert(!/(^|[-_:/\s])(pending|placeholder|todo|tbd|dummy|mock|localhost|127\.0\.0\.1|0\.0\.0\.0)([-_:/\s]|$)/i.test(value), `${label} must not be placeholder/local text`);
  if (!context.isFixture) assert(!/(^|[-_:/\s])(fixture|example)([-_:/\s]|$)/i.test(value), `${label} must not be fixture/example text for final evidence`);
}

function assertHttpsUrl(value, label, context) {
  assertText(value, label, context);
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }
  assert(url.protocol === "https:", `${label} must use https`);
  assertPublicHostname(url.hostname, label);
}

function assertAllureReportUrl(value, label, context) {
  assertHttpsUrl(value, label, context);
  const url = new URL(value);
  assert(/\/admin\/test-reports\/allure\/(latest|runs\/[^/]+)\//.test(url.pathname), `${label} must use an Allure latest or run path`);
}

function assertEvaluationReportUrl(value, label, context) {
  assertHttpsUrl(value, label, context);
  const url = new URL(value);
  assert(/\/admin\/evaluation-reports\/[^/]+\//.test(url.pathname), `${label} must use an admin evaluation report path`);
}

function assertS3Uri(value, label, context) {
  assertText(value, label, context);
  assert(/^s3:\/\/[^/]+\/.+/.test(value), `${label} must be an s3:// URI with a key prefix`);
}

function assertArn(value, label, service, context) {
  assertText(value, label, context);
  assert(value.startsWith(`arn:aws:${service}:`), `${label} must be an arn:aws:${service} ARN`);
}

function assertPublicHostname(hostname, label) {
  assert(!["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname), `${label} must not use local hostname`);
  assert(!hostname.endsWith(".local") && !hostname.endsWith(".test") && !hostname.endsWith(".internal"), `${label} must not use local/internal hostname`);
  assert(!/^10\./.test(hostname) && !/^192\.168\./.test(hostname) && !/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname), `${label} must not use private IP hostname`);
}

function assertNumberAtMost(value, max, label) {
  assert(typeof value === "number" && Number.isFinite(value), `${label} must be a finite number`);
  assert(value <= max, `${label} must be <= ${max}`);
}

function assertNumberLessThan(value, max, label) {
  assert(typeof value === "number" && Number.isFinite(value), `${label} must be a finite number`);
  assert(value < max, `${label} must be < ${max}`);
}

function assertNumberAtLeast(value, min, label) {
  assert(typeof value === "number" && Number.isFinite(value), `${label} must be a finite number`);
  assert(value >= min, `${label} must be >= ${min}`);
}
