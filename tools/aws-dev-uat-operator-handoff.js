import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { buildExternalAcceptanceActionPlan, externalActionPlanPath } from "./external-acceptance-actions.js";
import { buildAwsDevUatRawCapturePlan, rawCapturePlanOutputPath } from "./aws-dev-uat-raw-capture-plan.js";
import {
  buildAwsDevUatFinalReadiness,
  awsDevUatEvidenceBundleManifestPath,
  awsDevUatFinalReadinessPath
} from "./aws-dev-uat-final-readiness.js";
import { awsDevUatOperatorInputScaffoldPath, buildAwsDevUatOperatorInputScaffold } from "./aws-dev-uat-operator-input.js";
import { awsDevUatOperatorExecutionRunbookPath } from "./aws-dev-uat-operator-execution-runbook.js";
import { currentGitCommit } from "./git-context.js";
import { currentJstTimestamp } from "./lib.js";

export const awsDevUatOperatorHandoffPath = "dist/acceptance/aws_dev_uat_operator_handoff.json";

const handoffActionIds = [
  "release-tag",
  "github-release",
  "aws-deploy-publish",
  "cloudformation-capture",
  "aws-dev-uat-validation",
  "defect-snapshot-refresh",
  "final-evidence-candidate",
  "final-checklist-signoff"
];

export function buildAwsDevUatOperatorHandoff(options = {}) {
  const outputPath = options.outputPath || awsDevUatOperatorHandoffPath;
  const externalActionPlan = options.externalActionPlan || buildExternalAcceptanceActionPlan(options.externalActionPlanPath || externalActionPlanPath);
  const rawCapturePlan = options.rawCapturePlan || buildAwsDevUatRawCapturePlan({
    outputPath: options.rawCapturePlanPath || rawCapturePlanOutputPath
  });
  const operatorInput = options.operatorInput || buildAwsDevUatOperatorInputScaffold({
    outputPath: options.operatorInputPath || awsDevUatOperatorInputScaffoldPath,
    rawCapturePlan,
    rawCapturePlanPath: options.rawCapturePlanPath || rawCapturePlanOutputPath
  });
  const finalReadiness = options.finalReadiness || buildAwsDevUatFinalReadiness({
    outputPath: options.finalReadinessPath || awsDevUatFinalReadinessPath,
    rawCapturePlanPath: options.rawCapturePlanPath || rawCapturePlanOutputPath,
    rawCapturePlan,
    probeAwsIdentity: false
  });

  const actions = handoffActionIds.map((id) => actionSummary(externalActionPlan, id));
  const awsValidation = actions.find((action) => action.id === "aws-dev-uat-validation");
  const deployPublish = actions.find((action) => action.id === "aws-deploy-publish");
  const cloudFormationCapture = actions.find((action) => action.id === "cloudformation-capture");

  const handoff = {
    schema_version: "saphnexa-aws-dev-uat-operator-handoff.v1",
    generated_at: currentJstTimestamp(),
    generated_by: "tools/check-aws-dev-uat-operator-handoff.js",
    git_commit_sha: currentGitCommit(),
    handoff_ready: actions.every((action) => action.status === "pending" && action.requires_confirmation === true),
    execution_status: finalReadiness.status,
    aws_ready: finalReadiness.ready,
    external_state_change: false,
    does_not_execute_commands: true,
    source_artifacts: {
      external_action_plan: options.externalActionPlanPath || externalActionPlanPath,
      raw_capture_plan: options.rawCapturePlanPath || rawCapturePlanOutputPath,
      operator_input_scaffold: options.operatorInputPath || awsDevUatOperatorInputScaffoldPath,
      operator_execution_runbook: awsDevUatOperatorExecutionRunbookPath,
      final_readiness: options.finalReadinessPath || awsDevUatFinalReadinessPath
    },
    required_inputs: {
      environment: rawCapturePlan.environment,
      region: rawCapturePlan.region,
      stack_name: rawCapturePlan.stack_name,
      operator_input: {
        scaffold_path: operatorInput.source_artifacts.operator_input_scaffold,
        resolved_path: operatorInput.source_artifacts.resolved_operator_input,
        resolved_check_command: operatorInput.command_templates.resolved_operator_input_check,
        runbook_check_command: `npm run aws:dev-uat:operator-runbook:check -- --input ${operatorInput.source_artifacts.resolved_operator_input} --require-resolved`
      },
      release: ["commit_sha", "git_tag", "github_release_url"],
      aws_identity: "aws sts get-caller-identity --output json",
      test_identities: ["general_user", "admin"],
      datasets: ["golden-v0.17"],
      evidence: evidenceInputs(rawCapturePlan),
      approval_required_for: ["cdk deploy", "flyway apply", "s3 publish", "load test", "Bedrock evaluation", "final checklist signoff"]
    },
    execution_groups: [
      group("release", ["release-tag", "github-release"], actions),
      group("deploy_publish", ["aws-deploy-publish", "cloudformation-capture"], actions),
      group("aws_dev_uat_validation", ["aws-dev-uat-validation"], actions),
      group("final_acceptance", ["defect-snapshot-refresh", "final-evidence-candidate", "final-checklist-signoff"], actions)
    ],
    critical_command_order: [
      ...deployPublish.candidate_commands,
      ...cloudFormationCapture.candidate_commands,
      "npm run aws:dev-uat:execution-bridge:probe",
      ...rawCapturePlan.modes.preflight.finalization_order.map((step) => rawCapturePlan.modes.preflight[step]).filter(Boolean),
      ...awsValidation.candidate_commands.filter((command) => !command.includes("preflight-raw-input:build") && !command.includes("preflight:build")),
      "npm run aws:dev-uat:final-readiness:check -- --probe-aws-identity --require-ready"
    ],
    evidence_outputs: unique(actions.flatMap((action) => action.evidence_outputs)),
    blockers: finalReadiness.blockers,
    next_commands: finalReadiness.next_commands,
    note: "This handoff does not deploy, migrate, publish, run E2E, run load tests, invoke Bedrock, create releases, or sign checklists. It only packages the approval-required execution plan and current readiness state for an operator."
  };

  writeJson(outputPath, handoff);
  return handoff;
}

export function requiredAwsDevUatOperatorHandoffActionIds() {
  return [...handoffActionIds];
}

function actionSummary(plan, id) {
  const action = plan.actions.find((item) => item.id === id);
  if (!action) throw new Error(`external action missing from handoff: ${id}`);
  return {
    id: action.id,
    title: action.title,
    acceptance_ids: action.acceptance_ids,
    status: action.status,
    requires_confirmation: action.requires_confirmation,
    external_state_change: action.external_state_change,
    completed: action.completed,
    required_before_run: action.required_before_run,
    candidate_commands: action.candidate_commands,
    evidence_outputs: action.evidence_outputs
  };
}

function group(id, actionIds, actions) {
  const selected = actions.filter((action) => actionIds.includes(action.id));
  return {
    id,
    action_ids: actionIds,
    status: selected.every((action) => action.status === "pending") ? "pending" : "mixed",
    requires_confirmation: selected.every((action) => action.requires_confirmation === true),
    external_state_change: selected.some((action) => action.external_state_change === true),
    candidate_commands: selected.flatMap((action) => action.candidate_commands),
    evidence_outputs: unique(selected.flatMap((action) => action.evidence_outputs))
  };
}

function evidenceInputs(rawCapturePlan) {
  const preflight = rawCapturePlan.modes.preflight;
  const validation = rawCapturePlan.modes.validation;
  return {
    preflight: evidenceStageInput(preflight),
    validation: evidenceStageInput(validation),
    evidence_bundle: {
      manifest_path: awsDevUatEvidenceBundleManifestPath,
      check_command: `npm run aws:dev-uat:evidence-bundle:check -- --preflight-raw-input ${preflight.raw_input_path} --validation-raw-input ${validation.raw_input_path} --preflight-evidence ${preflight.evidence_output_path} --validation-evidence ${validation.evidence_output_path} --execution-bridge dist/acceptance/aws_dev_uat_execution_bridge.json --output ${awsDevUatEvidenceBundleManifestPath}`
    }
  };
}

function evidenceStageInput(stage) {
  return {
    raw_input_path: stage.raw_input_path,
    raw_input_scaffold_path: stage.raw_input_scaffold_path,
    raw_output_check_command: stage.raw_output_check_command,
    raw_input_check_command: stage.raw_input_check_command,
    final_evidence_path: stage.evidence_output_path,
    build_command: stage.build_command,
    final_command: stage.final_command
  };
}

function unique(items) {
  return [...new Set(items)];
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}
