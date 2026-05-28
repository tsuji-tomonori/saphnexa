import { isAbsolute } from "node:path";
import { existsSync } from "node:fs";
import { assert, isCurrentJstTimestamp, readJson } from "./lib.js";
import {
  preflightCaptureCommandIds,
  preflightEvidenceOutputPath,
  validationCaptureCommandIds,
  validationEvidenceOutputPath
} from "./aws-dev-uat-evidence-builders.js";
import { rawCapturePlanOutputPath } from "./aws-dev-uat-raw-capture-plan.js";

if (process.argv[1]?.endsWith("check-aws-dev-uat-raw-capture-plan.js")) {
  const path = process.argv.find((item, index) => index > 1 && !item.startsWith("--")) || rawCapturePlanOutputPath;
  assert(existsSync(path), `AWS dev/UAT raw capture plan missing: ${path}`);
  validateRawCapturePlan(readJson(path));
  console.log(`AWS dev/UAT raw capture plan check passed: ${path}`);
}

export function validateRawCapturePlan(plan) {
  assert(plan.schema_version === "saphnexa-aws-dev-uat-raw-capture-plan.v1", "raw capture plan schema mismatch");
  assert(isCurrentJstTimestamp(plan.generated_at), "raw capture plan generated_at must be current JST timestamp");
  assert(plan.status === "requires_external_execution", "raw capture plan status mismatch");
  assert(["dev", "uat"].includes(plan.environment), "raw capture plan environment must be dev or uat");
  assert(plan.region === "ap-northeast-1", "raw capture plan region must be ap-northeast-1");
  assert(plan.stack_name === `saphnexa-${plan.environment}` || plan.stack_name.startsWith(`saphnexa-${plan.environment}-`), "raw capture plan stack_name must target the selected environment");
  assert(plan.external_state_change === false, "raw capture plan must not change external state");
  assert(plan.does_not_execute_commands === true, "raw capture plan must only describe commands");
  assert(plan.requires_aws_credentials === true, "raw capture plan must require AWS credentials for execution");
  assert(plan.note.includes("does not deploy"), "raw capture plan must state it does not deploy");
  assert(plan.note.includes("change AWS state"), "raw capture plan must state it does not change AWS state");

  validateMode(plan.modes?.preflight, {
    label: "preflight",
    expectedRawInputPath: `${plan.capture_root}/aws_dev_uat_preflight.raw.json`,
    expectedEvidenceOutputPath: preflightEvidenceOutputPath,
    expectedBuildCommand: "npm run aws:dev-uat:preflight:build -- --input dist/acceptance/raw/aws_dev_uat_preflight.raw.json",
    expectedFinalCommand: "npm run aws:dev-uat:preflight:final",
    expectedCommandIds: preflightCaptureCommandIds,
    expectedOutputRefs: [
      "raw/aws-sts-get-caller-identity.json",
      "raw/cloudformation-describe-stacks.json",
      "raw/cloudformation-list-stack-resources.json",
      "raw/flyway-info.json",
      "raw/openapi.json",
      "raw/edge-realtime-smoke.json",
      "raw/rag-runtime-smoke.json",
      "raw/admin-artifacts-smoke.json"
    ]
  });
  validateMode(plan.modes?.validation, {
    label: "validation",
    expectedRawInputPath: `${plan.capture_root}/aws_dev_uat_validation.raw.json`,
    expectedEvidenceOutputPath: validationEvidenceOutputPath,
    expectedMaterializeCommand: `npm run aws:dev-uat:validation-raw-input:build -- --scaffold ${plan.capture_root}/aws_dev_uat_validation.raw.scaffold.json --output ${plan.capture_root}/aws_dev_uat_validation.raw.json --captured-at <capture-jst-timestamp> --git-tag <release-tag> --github-release-url <github-release-url> --aws-account-id <aws-account-id>`,
    expectedRawOutputCheckCommand: `npm run aws:dev-uat:raw-output:check -- validation --input ${plan.capture_root}/aws_dev_uat_validation.raw.json`,
    expectedRawInputCheckCommand: `npm run aws:dev-uat:raw-input:check -- validation --input ${plan.capture_root}/aws_dev_uat_validation.raw.json`,
    expectedBuildCommand: "npm run aws:dev-uat:validation:build -- --input dist/acceptance/raw/aws_dev_uat_validation.raw.json",
    expectedFinalCommand: "npm run aws:dev-uat:validation:final",
    expectedFinalizationOrder: [
      "commands",
      "materialize_command",
      "raw_output_check_command",
      "raw_input_check_command",
      "build_command",
      "final_command"
    ],
    expectedCommandIds: validationCaptureCommandIds,
    expectedOutputRefs: [
      "raw/e2e-allure-run.json",
      "raw/cloudfront-access-log-list.txt",
      "raw/performance-report.json",
      "raw/cloudwatch-dashboard.json",
      "raw/rag-quality-report.json",
      "raw/bedrock-evaluation-job.json"
    ]
  });
}

function validateMode(mode, context) {
  assert(mode && typeof mode === "object", `raw capture plan missing ${context.label} mode`);
  assert(mode.raw_input_path === context.expectedRawInputPath, `${context.label}.raw_input_path mismatch`);
  assert(mode.evidence_output_path === context.expectedEvidenceOutputPath, `${context.label}.evidence_output_path mismatch`);
  if (context.expectedMaterializeCommand) {
    assert(mode.raw_input_scaffold_path === mode.raw_input_path.replace(/\.raw\.json$/, ".raw.scaffold.json"), `${context.label}.raw_input_scaffold_path mismatch`);
    assert(mode.materialize_command === context.expectedMaterializeCommand, `${context.label}.materialize_command mismatch`);
    assert(mode.raw_output_check_command === context.expectedRawOutputCheckCommand, `${context.label}.raw_output_check_command mismatch`);
    assert(mode.raw_input_check_command === context.expectedRawInputCheckCommand, `${context.label}.raw_input_check_command mismatch`);
    assert(JSON.stringify(mode.finalization_order || []) === JSON.stringify(context.expectedFinalizationOrder), `${context.label}.finalization_order mismatch`);
    assert(
      mode.finalization_order.indexOf("materialize_command") < mode.finalization_order.indexOf("raw_output_check_command"),
      `${context.label}.materialize_command must run before raw output check`
    );
    assert(
      mode.finalization_order.indexOf("raw_input_check_command") < mode.finalization_order.indexOf("build_command"),
      `${context.label}.raw_input_check_command must run before build command`
    );
  }
  assert(mode.build_command === context.expectedBuildCommand, `${context.label}.build_command mismatch`);
  assert(mode.final_command === context.expectedFinalCommand, `${context.label}.final_command mismatch`);
  assert(JSON.stringify(mode.required_command_ids || []) === JSON.stringify(context.expectedCommandIds), `${context.label}.required_command_ids mismatch`);
  assert(Array.isArray(mode.commands), `${context.label}.commands must be an array`);
  assert(JSON.stringify(mode.commands.map((item) => item.id)) === JSON.stringify(context.expectedCommandIds), `${context.label}.commands id order mismatch`);
  assert(JSON.stringify(mode.commands.map((item) => item.output_ref)) === JSON.stringify(context.expectedOutputRefs), `${context.label}.commands output_ref mismatch`);

  const outputRefs = new Set();
  for (const item of mode.commands) {
    assert(typeof item.command === "string" && item.command.trim().length > 0, `${context.label}.${item.id}.command is required`);
    assert(!/(placeholder|todo|tbd|dummy|mock|localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(item.command), `${context.label}.${item.id}.command must not be placeholder/local text`);
    if (context.label === "validation") {
      assert(!/(npm run test:e2e:aws|npm run perf:aws|npm run rag:quality:aws)/.test(item.command), `${context.label}.${item.id}.command must not call final suite gate as raw capture`);
    }
    assertNodeHelperExists(item.command, `${context.label}.${item.id}.command`);
    assert(typeof item.output_ref === "string" && item.output_ref.startsWith("raw/"), `${context.label}.${item.id}.output_ref must stay under raw/`);
    assert(!isAbsolute(item.output_ref), `${context.label}.${item.id}.output_ref must be relative`);
    assert(!item.output_ref.split(/[\\/]/).includes(".."), `${context.label}.${item.id}.output_ref must not traverse directories`);
    assert(!outputRefs.has(item.output_ref), `${context.label}.${item.id}.output_ref must be unique`);
    assert(["json", "text"].includes(item.output_kind), `${context.label}.${item.id}.output_kind mismatch`);
    assert(item.status_after_capture === "captured", `${context.label}.${item.id}.status_after_capture mismatch`);
    outputRefs.add(item.output_ref);
  }
}

function assertNodeHelperExists(command, label) {
  const match = command.match(/^node (tools\/[A-Za-z0-9._-]+\.js)(?:\s|$)/);
  if (!match) return;
  assert(existsSync(match[1]), `${label} references missing helper: ${match[1]}`);
}
