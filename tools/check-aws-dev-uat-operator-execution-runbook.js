import {
  awsDevUatOperatorExecutionRunbookPath,
  buildAwsDevUatOperatorExecutionRunbook,
  requiredAwsDevUatOperatorExecutionPhaseIds
} from "./aws-dev-uat-operator-execution-runbook.js";
import { assert, isCurrentJstTimestamp } from "./lib.js";

const args = process.argv.slice(2);
if (process.argv[1]?.endsWith("check-aws-dev-uat-operator-execution-runbook.js")) {
  const outputPath = valueFor(args, "--output") || awsDevUatOperatorExecutionRunbookPath;
  const operatorInputPath = valueFor(args, "--input") || null;
  const requireResolved = args.includes("--require-resolved");
  const runbook = buildAwsDevUatOperatorExecutionRunbook({
    outputPath,
    operatorInputPath: operatorInputPath || undefined
  });
  validateAwsDevUatOperatorExecutionRunbook(runbook, { requireResolved });
  console.log(`AWS dev/UAT operator execution runbook check passed: ${outputPath} (${runbook.runbook_status})`);
}

export function validateAwsDevUatOperatorExecutionRunbook(runbook, options = {}) {
  assert(runbook.schema_version === "saphnexa-aws-dev-uat-operator-execution-runbook.v1", "operator execution runbook schema mismatch");
  assert(isCurrentJstTimestamp(runbook.generated_at), "operator execution runbook generated_at must be current JST timestamp");
  assert(runbook.generated_by === "tools/check-aws-dev-uat-operator-execution-runbook.js", "operator execution runbook generated_by mismatch");
  assert(/^[a-f0-9]{40}$/.test(runbook.git_commit_sha), "operator execution runbook git commit mismatch");
  assert(["ready_for_external_execution", "requires_resolved_operator_input"].includes(runbook.runbook_status), "operator execution runbook status mismatch");
  assert(runbook.ready_for_external_execution === (runbook.runbook_status === "ready_for_external_execution"), "operator execution runbook ready/status mismatch");
  assert(runbook.external_state_change === false, "operator execution runbook must not change external state");
  assert(runbook.does_not_execute_commands === true, "operator execution runbook must not execute commands");
  assert(runbook.source_artifacts.external_action_plan.endsWith("external_action_plan.json"), "operator execution runbook external action path mismatch");
  assert(runbook.source_artifacts.raw_capture_plan.endsWith("aws_dev_uat_raw_capture_plan.json"), "operator execution runbook raw capture path mismatch");
  assert(runbook.source_artifacts.resolved_operator_input === "dist/acceptance/aws_dev_uat_operator_input.json", "operator execution runbook resolved input path mismatch");
  assert(runbook.runtime.environment === "uat", "operator execution runbook environment mismatch");
  assert(runbook.runtime.region === "ap-northeast-1", "operator execution runbook region mismatch");
  assert(runbook.runtime.stack_name === "saphnexa-uat", "operator execution runbook stack mismatch");
  assert(Array.isArray(runbook.phase_order), "operator execution runbook phase_order missing");
  assert(JSON.stringify(runbook.phase_order) === JSON.stringify(requiredAwsDevUatOperatorExecutionPhaseIds()), "operator execution runbook phase order mismatch");
  assert(Array.isArray(runbook.phases) && runbook.phases.length === runbook.phase_order.length, "operator execution runbook phases mismatch");

  for (const id of requiredAwsDevUatOperatorExecutionPhaseIds()) {
    assert(runbook.phases.some((phase) => phase.id === id), `operator execution runbook missing phase: ${id}`);
  }
  for (const phase of runbook.phases) validatePhase(phase, runbook.ready_for_external_execution);

  assertBefore(runbook, "release", "deploy_publish");
  assertBefore(runbook, "deploy_publish", "preflight_capture");
  assertBefore(runbook, "preflight_capture", "preflight_materialization");
  assertBefore(runbook, "preflight_materialization", "validation_capture");
  assertBefore(runbook, "validation_capture", "validation_materialization");
  assertBefore(runbook, "validation_materialization", "final_gates");
  assertBefore(runbook, "final_gates", "final_acceptance");

  assertCommandIncludes(runbook, "release", "git tag -a");
  assertCommandIncludes(runbook, "deploy_publish", "cdk deploy --context env=uat");
  assertCommandIncludes(runbook, "preflight_capture", "aws sts get-caller-identity --output json");
  assertCommandIncludes(runbook, "preflight_materialization", "npm run aws:dev-uat:preflight-raw-input:build");
  assertCommandIncludes(runbook, "validation_capture", "aws bedrock get-evaluation-job");
  assertCommandIncludes(runbook, "validation_materialization", "npm run aws:dev-uat:validation-raw-input:build");
  assertCommandIncludes(runbook, "validation_materialization", "npm run test:e2e:aws");
  assertCommandIncludes(runbook, "validation_materialization", "npm run perf:aws");
  assertCommandIncludes(runbook, "validation_materialization", "npm run rag:quality:aws");
  assertCommandIncludes(runbook, "final_gates", "npm run aws:dev-uat:final-readiness:check -- --probe-aws-identity --require-ready");
  assertCommandIncludes(runbook, "final_acceptance", "npm run acceptance:final-candidate:check");
  assertCommandBefore(runbook, "validation_materialization", "aws:dev-uat:validation:build", "npm run test:e2e:aws");
  assertCommandBefore(runbook, "validation_materialization", "npm run test:e2e:aws", "npm run perf:aws");
  assertCommandBefore(runbook, "validation_materialization", "npm run perf:aws", "npm run rag:quality:aws");
  assertCommandBefore(runbook, "validation_materialization", "npm run rag:quality:aws", "npm run aws:dev-uat:validation:final");
  assertCommandBefore(runbook, "final_gates", "aws:dev-uat:operator-input:check", "aws:dev-uat:evidence-bundle:check");
  assertCommandBefore(runbook, "final_gates", "aws:dev-uat:evidence-bundle:check", "aws:dev-uat:final-readiness:check");

  assert(runbook.evidence_outputs.includes("dist/acceptance/aws_dev_uat_operator_execution_runbook.json") === false, "operator execution runbook must not cite itself as AWS evidence");
  assert(runbook.evidence_outputs.includes("dist/acceptance/aws_dev_uat_final_readiness.json"), "operator execution runbook missing final readiness evidence output");
  assert(runbook.note.includes("does not deploy"), "operator execution runbook must state it does not deploy");
  assert(runbook.note.includes("ordered commands"), "operator execution runbook must describe ordered commands");

  if (runbook.ready_for_external_execution) {
    assert(runbook.operator_input.ready === true, "ready operator execution runbook must have resolved operator input");
    assert(runbook.blockers.length === 0, "ready operator execution runbook must not have blockers");
    assert(runbook.next_commands.length === 0, "ready operator execution runbook must not have next commands");
    for (const command of allCommands(runbook)) {
      assert(command.resolved === true, `ready operator execution command must be resolved: ${command.id}`);
      assert(!hasForbiddenText(command.command), `ready operator execution command contains unresolved value: ${command.id}`);
    }
  } else {
    assert(runbook.operator_input.ready === false, "blocked operator execution runbook must expose unresolved operator input");
    assert(runbook.blockers.includes("missing_or_invalid_resolved_operator_input"), "blocked operator execution runbook blocker mismatch");
    assert(runbook.next_commands.includes("npm run aws:dev-uat:operator-input:check -- --input dist/acceptance/aws_dev_uat_operator_input.json --require-resolved"), "blocked operator execution runbook next command mismatch");
    assert(allCommands(runbook).some((command) => command.resolved === false), "blocked operator execution runbook must retain unresolved commands");
  }

  if (options.requireResolved) assert(runbook.ready_for_external_execution === true, `operator execution runbook is not ready: ${runbook.blockers.join(", ")}`);
}

function validatePhase(phase, ready) {
  assert(phaseIds().includes(phase.id), `unexpected operator execution phase: ${phase.id}`);
  assert(phase.requires_confirmation === true, `${phase.id} must require confirmation`);
  assert(phase.stop_on_failure === true, `${phase.id} must stop on failure`);
  assert(Array.isArray(phase.required_inputs) && phase.required_inputs.length > 0, `${phase.id} required inputs missing`);
  assert(Array.isArray(phase.commands) && phase.commands.length > 0, `${phase.id} commands missing`);
  assert(Array.isArray(phase.evidence_outputs) && phase.evidence_outputs.length > 0, `${phase.id} evidence outputs missing`);
  if (["release", "deploy_publish", "preflight_capture", "validation_capture", "final_acceptance"].includes(phase.id)) {
    assert(phase.external_state_change === true, `${phase.id} must be marked as external state change`);
  }
  for (const [index, command] of phase.commands.entries()) {
    assert(command.order === index + 1, `${phase.id} command order mismatch`);
    assert(typeof command.id === "string" && command.id.length > 0, `${phase.id} command id missing`);
    assert(typeof command.command === "string" && command.command.length > 0, `${phase.id} command text missing`);
    assert(command.source, `${phase.id} command source missing`);
    assert(typeof command.resolved === "boolean", `${phase.id} command resolved flag missing`);
    assert(typeof command.external_state_change === "boolean", `${phase.id} command external flag missing`);
    if (ready) assert(command.resolved === true, `${phase.id} ready command must be resolved`);
  }
}

function assertBefore(runbook, before, after) {
  assert(runbook.phase_order.indexOf(before) < runbook.phase_order.indexOf(after), `${before} must run before ${after}`);
}

function assertCommandIncludes(runbook, phaseId, text) {
  const phase = runbook.phases.find((item) => item.id === phaseId);
  assert(phase.commands.some((command) => command.command.includes(text)), `${phaseId} missing command containing ${text}`);
}

function assertCommandBefore(runbook, phaseId, before, after) {
  const commands = runbook.phases.find((phase) => phase.id === phaseId).commands;
  const beforeIndex = commands.findIndex((command) => command.command.includes(before));
  const afterIndex = commands.findIndex((command) => command.command.includes(after));
  assert(beforeIndex >= 0 && afterIndex >= 0 && beforeIndex < afterIndex, `${phaseId} command order mismatch: ${before} before ${after}`);
}

function allCommands(runbook) {
  return runbook.phases.flatMap((phase) => phase.commands);
}

function phaseIds() {
  return requiredAwsDevUatOperatorExecutionPhaseIds();
}

function hasForbiddenText(value) {
  return value.trim().length === 0 || /<[^>]+>|placeholder|todo|tbd|dummy|mock|sample|localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(value);
}

function valueFor(items, name) {
  const index = items.indexOf(name);
  if (index < 0) return null;
  return items[index + 1] || null;
}
