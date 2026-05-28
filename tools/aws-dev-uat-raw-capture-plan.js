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
        evidence_output_path: preflightEvidenceOutputPath,
        build_command: "npm run aws:dev-uat:preflight:build -- --input dist/acceptance/raw/aws_dev_uat_preflight.raw.json",
        final_command: "npm run aws:dev-uat:preflight:final",
        required_command_ids: preflightCaptureCommandIds,
        commands: preflightCommands({ environment, region, stackName, runId })
      },
      validation: {
        raw_input_path: `${captureRoot}/aws_dev_uat_validation.raw.json`,
        evidence_output_path: validationEvidenceOutputPath,
        build_command: "npm run aws:dev-uat:validation:build -- --input dist/acceptance/raw/aws_dev_uat_validation.raw.json",
        final_command: "npm run aws:dev-uat:validation:final",
        required_command_ids: validationCaptureCommandIds,
        commands: validationCommands({ environment, region, stackName, runId })
      }
    },
    note: "This plan writes a machine-checkable command/output map only. It does not deploy, migrate, publish, run load tests, invoke Bedrock, or change AWS state."
  };

  writeJson(outputPath, plan);
  return plan;
}

function preflightCommands({ environment, region, stackName, runId }) {
  return [
    command("aws-sts", "aws sts get-caller-identity --output json", "raw/aws-sts-get-caller-identity.json", "json"),
    command("cloudformation-describe-stacks", `aws cloudformation describe-stacks --stack-name ${stackName} --region ${region} --output json`, "raw/cloudformation-describe-stacks.json", "json"),
    command("cloudformation-list-stack-resources", `aws cloudformation list-stack-resources --stack-name ${stackName} --region ${region} --output json`, "raw/cloudformation-list-stack-resources.json", "json"),
    command("flyway-info", `flyway info -configFiles=conf/flyway-${environment}.conf -outputType=json`, "raw/flyway-info.json", "json"),
    command("hono-openapi", `curl -fsS https://api.${environment}.saphnexa.awsapps.com/openapi.json`, "raw/openapi.json", "json"),
    command("edge-realtime", `node tools/capture-edge-realtime-smoke.js --env ${environment} --run-id ${runId}`, "raw/edge-realtime-smoke.json", "json"),
    command("rag-runtime", `node tools/capture-rag-runtime-smoke.js --env ${environment} --run-id ${runId}`, "raw/rag-runtime-smoke.json", "json"),
    command("published-artifacts", `node tools/capture-admin-artifacts-smoke.js --env ${environment} --run-id ${runId}`, "raw/admin-artifacts-smoke.json", "json")
  ];
}

function validationCommands({ environment, region, stackName, runId }) {
  return [
    command("e2e-allure", `SAPHNEXA_ENV=${environment} SAPHNEXA_AWS_RUN_ID=${runId} npm run test:e2e:aws`, "raw/e2e-allure-run.json", "json"),
    command("cloudfront-access-log", `aws s3 ls s3://saphnexa-${environment}-logs/cloudfront/${runId}/ --region ${region}`, "raw/cloudfront-access-log-list.txt", "text"),
    command("performance-report", `SAPHNEXA_ENV=${environment} SAPHNEXA_AWS_RUN_ID=${runId} npm run perf:aws`, "raw/performance-report.json", "json"),
    command("cloudwatch-dashboard", `aws cloudwatch get-dashboard --dashboard-name ${stackName} --region ${region}`, "raw/cloudwatch-dashboard.json", "json"),
    command("rag-quality-report", `SAPHNEXA_ENV=${environment} SAPHNEXA_AWS_RUN_ID=${runId} npm run rag:quality:aws`, "raw/rag-quality-report.json", "json"),
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
