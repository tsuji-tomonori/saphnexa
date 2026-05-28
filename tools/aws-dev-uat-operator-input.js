import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { buildAwsDevUatRawCapturePlan, rawCapturePlanOutputPath } from "./aws-dev-uat-raw-capture-plan.js";
import {
  preflightRawInputScaffoldPath,
  validationRawInputScaffoldPath
} from "./aws-dev-uat-raw-input-scaffold.js";
import { currentGitCommit } from "./git-context.js";
import { currentJstTimestamp } from "./lib.js";

export const awsDevUatOperatorInputScaffoldPath = "dist/acceptance/aws_dev_uat_operator_input.scaffold.json";
export const awsDevUatOperatorInputPath = "dist/acceptance/aws_dev_uat_operator_input.json";

export function buildAwsDevUatOperatorInputScaffold(options = {}) {
  const outputPath = options.outputPath || awsDevUatOperatorInputScaffoldPath;
  const rawCapturePlan = options.rawCapturePlan || buildAwsDevUatRawCapturePlan({
    outputPath: options.rawCapturePlanPath || rawCapturePlanOutputPath,
    environment: options.environment,
    region: options.region,
    stackName: options.stackName,
    runId: options.runId,
    captureRoot: options.captureRoot
  });

  const input = {
    schema_version: "saphnexa-aws-dev-uat-operator-input.v1",
    generated_at: currentJstTimestamp(),
    generated_by: "tools/check-aws-dev-uat-operator-input.js",
    git_commit_sha: currentGitCommit(),
    input_status: "requires_operator_values",
    final_input: false,
    external_state_change: false,
    does_not_execute_commands: true,
    source_artifacts: {
      raw_capture_plan: options.rawCapturePlanPath || rawCapturePlanOutputPath,
      preflight_scaffold: preflightRawInputScaffoldPath,
      validation_scaffold: validationRawInputScaffoldPath,
      operator_input_scaffold: outputPath,
      resolved_operator_input: awsDevUatOperatorInputPath
    },
    runtime: {
      environment: rawCapturePlan.environment,
      region: rawCapturePlan.region,
      stack_name: rawCapturePlan.stack_name,
      run_id: rawCapturePlan.run_id
    },
    operator: {
      reviewer: null,
      approved_execution_window_jst: null
    },
    release: {
      commit_sha: currentGitCommit(),
      git_tag: null,
      github_release_url: null
    },
    aws: {
      account_id: null,
      identity_command: "aws sts get-caller-identity --output json"
    },
    raw_inputs: {
      preflight_scaffold_path: rawCapturePlan.modes.preflight.raw_input_scaffold_path,
      preflight_raw_input_path: rawCapturePlan.modes.preflight.raw_input_path,
      validation_scaffold_path: rawCapturePlan.modes.validation.raw_input_scaffold_path,
      validation_raw_input_path: rawCapturePlan.modes.validation.raw_input_path
    },
    publish: {
      admin_artifacts_bucket: null,
      docs_latest_s3_uri: "s3://<admin-artifacts-bucket>/docs-site/latest/",
      docs_v017_s3_uri: "s3://<admin-artifacts-bucket>/docs-site/releases/v0.17/",
      allure_latest_s3_uri: "s3://<admin-artifacts-bucket>/test-reports/allure/latest/",
      allure_run_s3_uri: "s3://<admin-artifacts-bucket>/test-reports/allure/runs/<test-run-id>/"
    },
    validation: {
      test_run_id: null,
      golden_dataset_id: "golden-v0.17",
      rag_evaluation_run_id: null,
      bedrock_evaluation_job_arn: null,
      e2e_allure_run_url: null,
      performance_report_url: null,
      rag_quality_report_url: null
    },
    command_templates: {
      operator_input_check: "npm run aws:dev-uat:operator-input:check",
      resolved_operator_input_check: `npm run aws:dev-uat:operator-input:check -- --input ${awsDevUatOperatorInputPath} --require-resolved`,
      preflight_materialize: rawCapturePlan.modes.preflight.materialize_command,
      validation_materialize: rawCapturePlan.modes.validation.materialize_command,
      evidence_bundle: "npm run aws:dev-uat:evidence-bundle:check -- --preflight-raw-input <raw-preflight-input.json> --validation-raw-input <raw-validation-input.json> --preflight-evidence dist/acceptance/aws_dev_uat_preflight.json --validation-evidence dist/acceptance/aws_dev_uat_validation.json --execution-bridge dist/acceptance/aws_dev_uat_execution_bridge.json --output dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json",
      final_readiness: "npm run aws:dev-uat:final-readiness:check -- --probe-aws-identity --require-ready"
    },
    resolved_commands: null,
    blocking_placeholders: [
      "operator.reviewer",
      "operator.approved_execution_window_jst",
      "release.git_tag",
      "release.github_release_url",
      "aws.account_id",
      "publish.admin_artifacts_bucket",
      "validation.test_run_id",
      "validation.rag_evaluation_run_id",
      "validation.bedrock_evaluation_job_arn",
      "validation.e2e_allure_run_url",
      "validation.performance_report_url",
      "validation.rag_quality_report_url",
      "resolved_commands"
    ],
    operator_notes: [
      "Fill this scaffold after release tag, GitHub release, AWS account, artifact bucket, test run, and Bedrock evaluation values are known.",
      "Save the resolved input as dist/acceptance/aws_dev_uat_operator_input.json.",
      "Run command_templates.resolved_operator_input_check before materializing AWS dev/UAT raw inputs.",
      "Do not treat this scaffold as AWS dev/UAT completion evidence."
    ]
  };

  writeJson(outputPath, input);
  return input;
}

export function cli(argv = process.argv.slice(2)) {
  const outputPath = valueFor(argv, "--output") || awsDevUatOperatorInputScaffoldPath;
  const input = buildAwsDevUatOperatorInputScaffold({ outputPath });
  console.log(`AWS dev/UAT operator input scaffold generated: ${outputPath} (${input.input_status})`);
}

function valueFor(items, name) {
  const index = items.indexOf(name);
  if (index < 0) return null;
  return items[index + 1] || null;
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}
