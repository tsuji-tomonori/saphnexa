import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { currentJstTimestamp } from "./lib.js";
import {
  preflightCaptureCommandIds,
  preflightEvidenceOutputPath,
  validationCaptureCommandIds,
  validationEvidenceOutputPath
} from "./aws-dev-uat-evidence-builders.js";

export const rawCapturePlanOutputPath = "dist/acceptance/aws_dev_uat_raw_capture_plan.json";

export function buildAwsDevUatRawCapturePlan(options = {}) {
  const environment = options.environment || "uat";
  const region = options.region || "ap-northeast-1";
  const stackName = options.stackName || `saphnexa-${environment}`;
  const runId = options.runId || `${environment}-manual-capture`;
  const captureRoot = options.captureRoot || "dist/acceptance/raw";
  const outputPath = options.outputPath || rawCapturePlanOutputPath;

  const plan = {
    schema_version: "saphnexa-aws-dev-uat-raw-capture-plan.v1",
    generated_at: currentJstTimestamp(),
    status: "requires_external_execution",
    environment,
    region,
    stack_name: stackName,
    run_id: runId,
    capture_root: captureRoot,
    external_state_change: false,
    does_not_execute_commands: true,
    requires_aws_credentials: true,
    modes: {
      preflight: {
        raw_input_path: `${captureRoot}/aws_dev_uat_preflight.raw.json`,
        raw_input_scaffold_path: `${captureRoot}/aws_dev_uat_preflight.raw.scaffold.json`,
        evidence_output_path: preflightEvidenceOutputPath,
        materialize_command: `npm run aws:dev-uat:preflight-raw-input:build -- --scaffold ${captureRoot}/aws_dev_uat_preflight.raw.scaffold.json --output ${captureRoot}/aws_dev_uat_preflight.raw.json --captured-at <capture-jst-timestamp> --git-tag <release-tag> --github-release-url <github-release-url>`,
        raw_output_check_command: `npm run aws:dev-uat:raw-output:check -- preflight --input ${captureRoot}/aws_dev_uat_preflight.raw.json`,
        raw_input_check_command: `npm run aws:dev-uat:raw-input:check -- preflight --input ${captureRoot}/aws_dev_uat_preflight.raw.json`,
        build_command: "npm run aws:dev-uat:preflight:build -- --input dist/acceptance/raw/aws_dev_uat_preflight.raw.json",
        final_command: "npm run aws:dev-uat:preflight:final",
        finalization_order: [
          "commands",
          "materialize_command",
          "raw_output_check_command",
          "raw_input_check_command",
          "build_command",
          "final_command"
        ],
        required_command_ids: preflightCaptureCommandIds,
        commands: preflightCommands({ captureRoot, environment, region, stackName, runId })
      },
      validation: {
        raw_input_path: `${captureRoot}/aws_dev_uat_validation.raw.json`,
        raw_input_scaffold_path: `${captureRoot}/aws_dev_uat_validation.raw.scaffold.json`,
        evidence_output_path: validationEvidenceOutputPath,
        materialize_command: `npm run aws:dev-uat:validation-raw-input:build -- --scaffold ${captureRoot}/aws_dev_uat_validation.raw.scaffold.json --output ${captureRoot}/aws_dev_uat_validation.raw.json --captured-at <capture-jst-timestamp> --git-tag <release-tag> --github-release-url <github-release-url> --aws-account-id <aws-account-id>`,
        raw_output_check_command: `npm run aws:dev-uat:raw-output:check -- validation --input ${captureRoot}/aws_dev_uat_validation.raw.json`,
        raw_input_check_command: `npm run aws:dev-uat:raw-input:check -- validation --input ${captureRoot}/aws_dev_uat_validation.raw.json`,
        build_command: "npm run aws:dev-uat:validation:build -- --input dist/acceptance/raw/aws_dev_uat_validation.raw.json",
        final_command: "npm run aws:dev-uat:validation:final",
        finalization_order: [
          "commands",
          "materialize_command",
          "raw_output_check_command",
          "raw_input_check_command",
          "build_command",
          "final_command"
        ],
        required_command_ids: validationCaptureCommandIds,
        commands: validationCommands({ environment, region, stackName, runId })
      }
    },
    note: "This plan writes a machine-checkable command/output map only. It does not deploy, migrate, publish, run load tests, invoke Bedrock, or change AWS state."
  };

  writeJson(outputPath, plan);
  return plan;
}

function preflightCommands({ captureRoot, environment, region, stackName, runId }) {
  return [
    command("aws-sts", "aws sts get-caller-identity --output json", "raw/aws-sts-get-caller-identity.json", "json"),
    command("cloudformation-describe-stacks", `aws cloudformation describe-stacks --stack-name ${stackName} --region ${region} --output json`, "raw/cloudformation-describe-stacks.json", "json"),
    command("cloudformation-list-stack-resources", `aws cloudformation list-stack-resources --stack-name ${stackName} --region ${region} --output json`, "raw/cloudformation-list-stack-resources.json", "json"),
    command("flyway-info", `node tools/capture-dsql-flyway-evidence.js --env ${environment} --region ${region} --stack-name ${stackName} --output ${captureRoot}/raw/flyway-info.json`, "raw/flyway-info.json", "json"),
    command("hono-openapi", `curl -fsS https://api.${environment}.saphnexa.awsapps.com/openapi.json`, "raw/openapi.json", "json"),
    command("edge-realtime", `node tools/capture-edge-realtime-smoke.js --env ${environment} --run-id ${runId}`, "raw/edge-realtime-smoke.json", "json"),
    command("rag-runtime", `node tools/capture-rag-runtime-smoke.js --env ${environment} --run-id ${runId}`, "raw/rag-runtime-smoke.json", "json"),
    command("published-artifacts", `node tools/capture-admin-artifacts-smoke.js --env ${environment} --run-id ${runId}`, "raw/admin-artifacts-smoke.json", "json")
  ];
}

function validationCommands({ environment, region, stackName, runId }) {
  return [
    command("e2e-allure", `node tools/capture-aws-dev-uat-e2e-result.js --env ${environment} --run-id ${runId}`, "raw/e2e-allure-run.json", "json"),
    command("cloudfront-access-log", `aws s3 ls s3://saphnexa-${environment}-logs/cloudfront/${runId}/ --region ${region}`, "raw/cloudfront-access-log-list.txt", "text"),
    command("performance-report", `node tools/capture-aws-dev-uat-performance-result.js --env ${environment} --run-id ${runId}`, "raw/performance-report.json", "json"),
    command("cloudwatch-dashboard", `aws cloudwatch get-dashboard --dashboard-name ${stackName} --region ${region}`, "raw/cloudwatch-dashboard.json", "json"),
    command("rag-quality-report", `node tools/capture-aws-dev-uat-rag-quality-result.js --env ${environment} --run-id ${runId}`, "raw/rag-quality-report.json", "json"),
    command("bedrock-evaluation-job", `aws bedrock get-evaluation-job --job-identifier rag-eval-${runId} --region ${region}`, "raw/bedrock-evaluation-job.json", "json")
  ];
}

function command(id, commandText, outputRef, outputKind) {
  return {
    id,
    command: commandText,
    output_ref: outputRef,
    output_kind: outputKind,
    status_after_capture: "captured"
  };
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}
