import { buildAwsDevUatOperatorInputScaffold, awsDevUatOperatorInputScaffoldPath } from "./aws-dev-uat-operator-input.js";
import { assert, isCurrentJstTimestamp, readJson } from "./lib.js";

const args = process.argv.slice(2);
if (process.argv[1]?.endsWith("check-aws-dev-uat-operator-input.js")) {
  const inputPath = valueFor(args, "--input");
  const requireResolved = args.includes("--require-resolved");
  const outputPath = valueFor(args, "--output") || awsDevUatOperatorInputScaffoldPath;
  const input = inputPath ? readJson(inputPath) : buildAwsDevUatOperatorInputScaffold({ outputPath });
  validateAwsDevUatOperatorInput(input, { requireResolved });
  console.log(`AWS dev/UAT operator input check passed: ${inputPath || outputPath} (${input.input_status})`);
}

export function validateAwsDevUatOperatorInput(input, options = {}) {
  assert(input.schema_version === "saphnexa-aws-dev-uat-operator-input.v1", "operator input schema mismatch");
  assert(isCurrentJstTimestamp(input.generated_at), "operator input generated_at must be current JST timestamp");
  assert(input.generated_by === "tools/check-aws-dev-uat-operator-input.js", "operator input generated_by mismatch");
  assert(/^[a-f0-9]{40}$/.test(input.git_commit_sha), "operator input git commit mismatch");
  assert(input.external_state_change === false, "operator input must not change external state");
  assert(input.does_not_execute_commands === true, "operator input must not execute commands");
  assert(input.runtime?.environment === "uat", "operator input environment mismatch");
  assert(input.runtime?.region === "ap-northeast-1", "operator input region mismatch");
  assert(input.runtime?.stack_name === "saphnexa-uat", "operator input stack name mismatch");
  assert(!hasForbiddenText(input.runtime?.run_id || ""), "operator input run id mismatch");
  assert(pathEndsWith(input.source_artifacts?.raw_capture_plan, "aws_dev_uat_raw_capture_plan.json"), "operator input raw capture plan path mismatch");
  assert(pathEndsWith(input.source_artifacts?.operator_input_scaffold, "aws_dev_uat_operator_input.scaffold.json"), "operator input scaffold path mismatch");
  assert(input.source_artifacts?.resolved_operator_input === "dist/acceptance/aws_dev_uat_operator_input.json", "operator input resolved path mismatch");
  assert(pathEndsWith(input.raw_inputs?.preflight_scaffold_path, "aws_dev_uat_preflight.raw.scaffold.json"), "operator input preflight scaffold path mismatch");
  assert(pathEndsWith(input.raw_inputs?.preflight_raw_input_path, "aws_dev_uat_preflight.raw.json"), "operator input preflight raw input path mismatch");
  assert(pathEndsWith(input.raw_inputs?.validation_scaffold_path, "aws_dev_uat_validation.raw.scaffold.json"), "operator input validation scaffold path mismatch");
  assert(pathEndsWith(input.raw_inputs?.validation_raw_input_path, "aws_dev_uat_validation.raw.json"), "operator input validation raw input path mismatch");
  assert(input.command_templates?.operator_input_check === "npm run aws:dev-uat:operator-input:check", "operator input scaffold check command mismatch");
  assert(
    input.command_templates?.resolved_operator_input_check === "npm run aws:dev-uat:operator-input:check -- --input dist/acceptance/aws_dev_uat_operator_input.json --require-resolved",
    "operator input resolved check command mismatch"
  );
  assert(input.command_templates?.preflight_materialize?.includes("npm run aws:dev-uat:preflight-raw-input:build"), "operator input preflight materialize command mismatch");
  assert(input.command_templates?.validation_materialize?.includes("npm run aws:dev-uat:validation-raw-input:build"), "operator input validation materialize command mismatch");
  assert(input.command_templates?.evidence_bundle?.includes("npm run aws:dev-uat:evidence-bundle:check"), "operator input evidence bundle command mismatch");
  assert(input.command_templates?.final_readiness === "npm run aws:dev-uat:final-readiness:check -- --probe-aws-identity --require-ready", "operator input final readiness command mismatch");

  if (options.requireResolved) validateResolvedInput(input);
  else validateScaffoldInput(input);
}

function validateScaffoldInput(input) {
  assert(input.input_status === "requires_operator_values", "operator input scaffold status mismatch");
  assert(input.final_input === false, "operator input scaffold must not be final input");
  for (const path of input.blocking_placeholders || []) {
    assert(typeof path === "string" && path.length > 0, "operator input blocking placeholder must be named");
  }
  for (const required of [
    "release.git_tag",
    "release.github_release_url",
    "aws.account_id",
    "publish.admin_artifacts_bucket",
    "validation.test_run_id",
    "resolved_commands"
  ]) {
    assert(input.blocking_placeholders.includes(required), `operator input scaffold missing placeholder: ${required}`);
  }
  assert(input.release?.git_tag === null, "operator input scaffold git_tag must stay null");
  assert(input.release?.github_release_url === null, "operator input scaffold release URL must stay null");
  assert(input.aws?.account_id === null, "operator input scaffold AWS account must stay null");
  assert(input.publish?.docs_latest_s3_uri.includes("<admin-artifacts-bucket>"), "operator input scaffold must keep publish placeholder");
  assert(input.validation?.test_run_id === null, "operator input scaffold test_run_id must stay null");
  assert(input.resolved_commands === null, "operator input scaffold resolved commands must stay null");
  assert(input.operator_notes.some((item) => item.includes("Do not treat this scaffold")), "operator input scaffold must warn against completion evidence use");
}

function validateResolvedInput(input) {
  assert(input.input_status === "ready_for_aws_dev_uat_execution", "resolved operator input status mismatch");
  assert(input.final_input === true, "resolved operator input must be final input");
  assert(!hasForbiddenValue(requiredPayload(input)), "resolved operator input contains placeholder, sample, local, or empty value");
  assert(/^[a-f0-9]{40}$/.test(input.release?.commit_sha || ""), "resolved operator input release commit mismatch");
  assert(/^v\d+\.\d+\.\d+([-.][A-Za-z0-9.-]+)?$/.test(input.release?.git_tag || ""), "resolved operator input git tag mismatch");
  assert(/^https:\/\/github\.com\/[^/]+\/[^/]+\/releases\/tag\/v\d+\.\d+\.\d+/.test(input.release?.github_release_url || ""), "resolved operator input release URL mismatch");
  assert(/^\d{12}$/.test(input.aws?.account_id || ""), "resolved operator input AWS account id mismatch");
  assert(/^saphnexa-[a-z0-9-]+-artifacts$/.test(input.publish?.admin_artifacts_bucket || ""), "resolved operator input artifact bucket mismatch");
  for (const field of ["docs_latest_s3_uri", "docs_v017_s3_uri", "allure_latest_s3_uri", "allure_run_s3_uri"]) {
    assert(String(input.publish?.[field] || "").startsWith(`s3://${input.publish.admin_artifacts_bucket}/`), `resolved operator input ${field} bucket mismatch`);
  }
  assert(input.validation?.golden_dataset_id === "golden-v0.17", "resolved operator input golden dataset mismatch");
  assert(/^arn:aws:bedrock:[a-z0-9-]+:\d{12}:evaluation-job\//.test(input.validation?.bedrock_evaluation_job_arn || ""), "resolved operator input Bedrock evaluation ARN mismatch");
  for (const field of ["e2e_allure_run_url", "performance_report_url", "rag_quality_report_url"]) {
    assert(/^https:\/\//.test(input.validation?.[field] || ""), `resolved operator input ${field} URL mismatch`);
  }
  assert(input.resolved_commands && typeof input.resolved_commands === "object", "resolved operator input commands missing");
  for (const [name, command] of Object.entries(input.resolved_commands)) {
    assert(typeof command === "string" && command.length > 0, `resolved operator input ${name} command missing`);
    assert(!hasForbiddenText(command), `resolved operator input ${name} command contains placeholder`);
  }
  assert(input.resolved_commands.preflight_materialize?.includes(input.release.git_tag), "resolved preflight command must include git tag");
  assert(input.resolved_commands.validation_materialize?.includes(input.aws.account_id), "resolved validation command must include AWS account id");
  assert(input.resolved_commands.resolved_operator_input_check === input.command_templates.resolved_operator_input_check, "resolved input check command mismatch");
}

function requiredPayload(input) {
  return {
    operator: input.operator,
    release: input.release,
    aws: { account_id: input.aws?.account_id },
    publish: input.publish,
    validation: input.validation,
    resolved_commands: input.resolved_commands
  };
}

function hasForbiddenValue(value) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.some((item) => hasForbiddenValue(item));
  if (typeof value === "object") return Object.values(value).some((item) => hasForbiddenValue(item));
  if (typeof value === "string") return hasForbiddenText(value);
  return false;
}

function hasForbiddenText(value) {
  return value.trim().length === 0 || /<[^>]+>|placeholder|todo|tbd|dummy|mock|sample|localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(value);
}

function valueFor(items, name) {
  const index = items.indexOf(name);
  if (index < 0) return null;
  return items[index + 1] || null;
}

function pathEndsWith(path, suffix) {
  return typeof path === "string" && path.endsWith(suffix) && !path.split(/[\\/]/).includes("..");
}
