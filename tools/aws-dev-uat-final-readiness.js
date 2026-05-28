import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { buildAwsDevUatRawCapturePlan, rawCapturePlanOutputPath } from "./aws-dev-uat-raw-capture-plan.js";
import { buildAwsDevUatExecutionBridge, expectedAwsDevUatFinalCommandOrder } from "./aws-dev-uat-execution-bridge.js";
import { awsDevUatOperatorInputPath } from "./aws-dev-uat-operator-input.js";
import { validateAwsDevUatOperatorInput } from "./check-aws-dev-uat-operator-input.js";
import { awsDevUatOperatorExecutionRunbookPath } from "./aws-dev-uat-operator-execution-runbook.js";
import { validateAwsDevUatOperatorExecutionRunbook } from "./check-aws-dev-uat-operator-execution-runbook.js";
import { currentGitCommit } from "./git-context.js";
import { currentJstTimestamp, readJson } from "./lib.js";

export const awsDevUatFinalReadinessPath = "dist/acceptance/aws_dev_uat_final_readiness.json";
export const awsDevUatEvidenceBundleManifestPath = "dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json";

export function buildAwsDevUatFinalReadiness(options = {}) {
  const outputPath = options.outputPath || awsDevUatFinalReadinessPath;
  const rawCapturePlanPath = options.rawCapturePlanPath || rawCapturePlanOutputPath;
  const plan = options.rawCapturePlan || buildAwsDevUatRawCapturePlan({ outputPath: rawCapturePlanPath });
  const bridgePath = options.executionBridgePath || "dist/acceptance/aws_dev_uat_execution_bridge.json";
  const bridge = options.executionBridge || buildAwsDevUatExecutionBridge(bridgePath, {
    probeAwsIdentity: options.probeAwsIdentity === true
  });
  const awsIdentity = options.awsIdentity || bridge.aws_identity;
  const preflightRawInputPath = options.preflightRawInputPath || plan.modes.preflight.raw_input_path;
  const validationRawInputPath = options.validationRawInputPath || plan.modes.validation.raw_input_path;
  const preflightEvidencePath = options.preflightEvidencePath || plan.modes.preflight.evidence_output_path;
  const validationEvidencePath = options.validationEvidencePath || plan.modes.validation.evidence_output_path;
  const evidenceBundleManifestPath = options.evidenceBundleManifestPath || awsDevUatEvidenceBundleManifestPath;
  const operatorInputPath = options.operatorInputPath || awsDevUatOperatorInputPath;
  const operatorRunbookPath = options.operatorRunbookPath || awsDevUatOperatorExecutionRunbookPath;

  const stages = [
    modeStage("preflight", plan.modes.preflight, {
      rawInputPath: preflightRawInputPath,
      evidencePath: preflightEvidencePath
    }),
    modeStage("validation", plan.modes.validation, {
      rawInputPath: validationRawInputPath,
      evidencePath: validationEvidencePath
    })
  ];
  const bridgeState = fileState("execution-bridge", bridgePath, true);
  const operatorInput = operatorInputState(operatorInputPath);
  const operatorRunbook = operatorRunbookState(operatorRunbookPath);
  const bundleState = fileState("evidence-bundle", evidenceBundleManifestPath, true);
  const blockers = [];
  const nextCommands = [];

  if (awsIdentity.status !== "authenticated") {
    blockers.push(`aws_identity_${awsIdentity.status}`);
    nextCommands.push("npm run aws:dev-uat:execution-bridge:probe");
  }
  for (const stage of stages) {
    collectStageReadiness(stage, blockers, nextCommands);
  }
  if (!bridgeState.exists) {
    blockers.push("missing_execution_bridge");
    nextCommands.push("npm run aws:dev-uat:execution-bridge:check");
  }
  if (!operatorInput.exists) {
    blockers.push("missing_operator_input");
    nextCommands.push("npm run aws:dev-uat:operator-input:build");
    nextCommands.push("npm run aws:dev-uat:operator-input:check");
    nextCommands.push(`npm run aws:dev-uat:operator-input:check -- --input ${operatorInputPath} --require-resolved`);
  } else if (!operatorInput.ready) {
    blockers.push("invalid_operator_input");
    nextCommands.push(`npm run aws:dev-uat:operator-input:check -- --input ${operatorInputPath} --require-resolved`);
  } else if (operatorInput.current_git_commit === false) {
    blockers.push("stale_operator_input");
    nextCommands.push(`npm run aws:dev-uat:operator-input:check -- --input ${operatorInputPath} --require-resolved`);
  }
  if (!operatorRunbook.exists) {
    blockers.push("missing_operator_runbook");
    nextCommands.push("npm run aws:dev-uat:operator-runbook:build");
    nextCommands.push("npm run aws:dev-uat:operator-runbook:check");
    nextCommands.push(`npm run aws:dev-uat:operator-runbook:check -- --input ${operatorInputPath} --require-resolved`);
  } else if (!operatorRunbook.ready) {
    blockers.push("invalid_operator_runbook");
    nextCommands.push(`npm run aws:dev-uat:operator-runbook:check -- --input ${operatorInputPath} --require-resolved`);
  } else if (operatorRunbook.current_git_commit === false) {
    blockers.push("stale_operator_runbook");
    nextCommands.push(`npm run aws:dev-uat:operator-runbook:check -- --input ${operatorInputPath} --require-resolved`);
  }
  if (!bundleState.exists) {
    blockers.push("missing_evidence_bundle_manifest");
    nextCommands.push(
      `npm run aws:dev-uat:evidence-bundle:check -- --preflight-raw-input ${preflightRawInputPath} --validation-raw-input ${validationRawInputPath} --preflight-evidence ${preflightEvidencePath} --validation-evidence ${validationEvidencePath} --execution-bridge ${bridgePath} --output ${evidenceBundleManifestPath}`
    );
  }

  const manifest = {
    schema_version: "saphnexa-aws-dev-uat-final-readiness.v1",
    generated_at: currentJstTimestamp(),
    generated_by: "tools/check-aws-dev-uat-final-readiness.js",
    git_commit_sha: currentGitCommit(),
    status: blockers.length === 0 ? "ready_for_final_acceptance_package" : "blocked_by_external_execution",
    ready: blockers.length === 0,
    external_state_change: false,
    does_not_execute_commands: true,
    raw_capture_plan: fileState("raw-capture-plan", rawCapturePlanPath, true),
    execution_bridge: bridgeState,
    operator_input: operatorInput,
    operator_execution_runbook: operatorRunbook,
    aws_identity: awsIdentity,
    command_order: {
      final_gates: expectedAwsDevUatFinalCommandOrder(),
      preflight_finalization: plan.modes.preflight.finalization_order,
      validation_finalization: plan.modes.validation.finalization_order
    },
    stages,
    evidence_bundle_manifest: bundleState,
    blockers: unique(blockers),
    next_commands: unique(nextCommands),
    note: "This readiness manifest does not deploy, migrate, publish, run E2E, run load tests, or invoke Bedrock. It only records whether captured AWS evidence, resolved operator input, and ready operator execution runbook are ready for final gates and bundling."
  };

  writeJson(outputPath, manifest);
  return manifest;
}

function operatorRunbookState(path) {
  const state = fileState("operator-execution-runbook", path, true);
  if (!state.exists) return state;

  let runbook;
  try {
    runbook = readJson(path);
  } catch (error) {
    return { ...state, parse_error: error.message, ready: false };
  }

  try {
    validateAwsDevUatOperatorExecutionRunbook(runbook, { requireResolved: true });
  } catch (error) {
    return {
      ...state,
      schema_version: runbook.schema_version || null,
      runbook_status: runbook.runbook_status || null,
      validation_error: error.message,
      ready: false
    };
  }

  return {
    ...state,
    schema_version: runbook.schema_version,
    runbook_status: runbook.runbook_status,
    ready_for_external_execution: runbook.ready_for_external_execution,
    current_git_commit: runbook.git_commit_sha === currentGitCommit(),
    phase_order: runbook.phase_order,
    ready: true
  };
}

function operatorInputState(path) {
  const state = fileState("operator-input", path, true);
  if (!state.exists) return state;

  let input;
  try {
    input = readJson(path);
  } catch (error) {
    return { ...state, parse_error: error.message, ready: false };
  }

  try {
    validateAwsDevUatOperatorInput(input, { requireResolved: true });
  } catch (error) {
    return {
      ...state,
      schema_version: input.schema_version || null,
      input_status: input.input_status || null,
      validation_error: error.message,
      ready: false
    };
  }

  return {
    ...state,
    schema_version: input.schema_version,
    input_status: input.input_status,
    final_input: input.final_input,
    release_git_tag: input.release?.git_tag || null,
    current_git_commit: input.git_commit_sha === currentGitCommit() && input.release?.commit_sha === currentGitCommit(),
    aws_account_id_present: /^\d{12}$/.test(input.aws?.account_id || ""),
    ready: true
  };
}

function modeStage(mode, planMode, paths) {
  const rawInput = rawInputState(mode, paths.rawInputPath);
  const evidence = evidenceState(mode, paths.evidencePath);
  return {
    mode,
    raw_input: rawInput,
    raw_outputs: rawInput.raw_outputs,
    final_evidence: evidence,
    materialize_command: planMode.materialize_command,
    raw_output_check_command: planMode.raw_output_check_command,
    raw_input_check_command: planMode.raw_input_check_command,
    build_command: planMode.build_command,
    final_command: planMode.final_command,
    required_command_ids: planMode.required_command_ids,
    finalization_order: planMode.finalization_order
  };
}

function rawInputState(mode, path) {
  const state = fileState("raw-input", path, true);
  if (!state.exists) return { ...state, raw_outputs: [] };

  let input;
  try {
    input = readJson(path);
  } catch (error) {
    return { ...state, parse_error: error.message, raw_outputs: [] };
  }

  const commands = input.capture_provenance?.commands || [];
  const rawOutputs = commands.map((command) => ({
    command_id: command.id,
    output_ref: command.output_ref,
    ...fileState("raw-output", resolve(dirname(path), command.output_ref || ""), true)
  }));
  return {
    ...state,
    capture_source: input.capture_provenance?.source || null,
    capture_statuses: commands.map((command) => ({ id: command.id, status: command.status })),
    raw_outputs: rawOutputs,
    ready: state.exists && rawOutputs.length > 0 && rawOutputs.every((item) => item.exists)
  };
}

function evidenceState(mode, path) {
  const state = fileState("final-evidence", path, true);
  if (!state.exists) return state;

  let evidence;
  try {
    evidence = readJson(path);
  } catch (error) {
    return { ...state, parse_error: error.message, evidence_class: null, current_git_commit: false };
  }
  return {
    ...state,
    evidence_class: evidence.evidence_class,
    schema_version: evidence.schema_version,
    current_git_commit: evidence.source?.git_commit_sha === currentGitCommit(),
    ready: evidence.evidence_class === "aws-captured" && evidence.source?.git_commit_sha === currentGitCommit()
  };
}

function collectStageReadiness(stage, blockers, nextCommands) {
  if (!stage.raw_input.exists) {
    blockers.push(`missing_${stage.mode}_raw_input`);
    nextCommands.push(stage.materialize_command);
    return;
  }
  if (stage.raw_input.parse_error) blockers.push(`invalid_${stage.mode}_raw_input`);
  const missingOutputs = stage.raw_outputs.filter((item) => !item.exists);
  if (missingOutputs.length > 0) {
    blockers.push(`missing_${stage.mode}_raw_outputs`);
    nextCommands.push(stage.raw_output_check_command);
  }
  if (!stage.raw_input.ready || stage.raw_input.parse_error) nextCommands.push(stage.raw_input_check_command);
  if (!stage.final_evidence.exists) {
    blockers.push(`missing_${stage.mode}_final_evidence`);
    nextCommands.push(stage.build_command);
    return;
  }
  if (stage.final_evidence.parse_error) blockers.push(`invalid_${stage.mode}_final_evidence`);
  if (stage.final_evidence.evidence_class !== "aws-captured") blockers.push(`${stage.mode}_final_evidence_not_aws_captured`);
  if (stage.final_evidence.current_git_commit === false) blockers.push(`${stage.mode}_final_evidence_stale_git_commit`);
  if (!stage.final_evidence.ready) nextCommands.push(stage.final_command);
}

function fileState(kind, path, includeHash = false) {
  const absolutePath = resolve(path);
  if (!existsSync(absolutePath)) {
    return {
      kind,
      path,
      exists: false,
      ready: false
    };
  }
  const body = readFileSync(absolutePath);
  return {
    kind,
    path,
    exists: true,
    ready: true,
    size_bytes: body.length,
    ...(includeHash ? { sha256: createHash("sha256").update(body).digest("hex") } : {})
  };
}

function unique(items) {
  return [...new Set(items)];
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}
