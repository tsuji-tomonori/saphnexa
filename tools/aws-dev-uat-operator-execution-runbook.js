import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { buildExternalAcceptanceActionPlan, externalActionPlanPath } from "./external-acceptance-actions.js";
import { buildAwsDevUatRawCapturePlan, rawCapturePlanOutputPath } from "./aws-dev-uat-raw-capture-plan.js";
import {
  awsDevUatOperatorInputPath,
  awsDevUatOperatorInputScaffoldPath,
  buildAwsDevUatOperatorInputScaffold
} from "./aws-dev-uat-operator-input.js";
import { validateAwsDevUatOperatorInput } from "./check-aws-dev-uat-operator-input.js";
import { currentGitCommit } from "./git-context.js";
import { currentJstTimestamp, readJson } from "./lib.js";

export const awsDevUatOperatorExecutionRunbookPath = "dist/acceptance/aws_dev_uat_operator_execution_runbook.json";

const phaseIds = [
  "release",
  "deploy_publish",
  "preflight_capture",
  "preflight_materialization",
  "validation_capture",
  "validation_materialization",
  "final_gates",
  "final_acceptance"
];

export function buildAwsDevUatOperatorExecutionRunbook(options = {}) {
  const outputPath = options.outputPath || awsDevUatOperatorExecutionRunbookPath;
  const operatorInputPath = options.operatorInputPath || awsDevUatOperatorInputScaffoldPath;
  const providedOperatorInput = options.operatorInput || (options.operatorInputPath ? readJson(options.operatorInputPath) : null);
  const rawCapturePlan = options.rawCapturePlan || buildAwsDevUatRawCapturePlan({
    outputPath: options.rawCapturePlanPath || rawCapturePlanOutputPath,
    environment: providedOperatorInput?.runtime?.environment,
    region: providedOperatorInput?.runtime?.region,
    stackName: providedOperatorInput?.runtime?.stack_name,
    runId: providedOperatorInput?.runtime?.run_id || options.runId
  });
  const externalActionPlan = options.externalActionPlan || buildExternalAcceptanceActionPlan(options.externalActionPlanPath || externalActionPlanPath);
  const operatorInput = providedOperatorInput || buildAwsDevUatOperatorInputScaffold({
    outputPath: operatorInputPath,
    rawCapturePlan,
    rawCapturePlanPath: options.rawCapturePlanPath || rawCapturePlanOutputPath
  });

  const operatorInputState = resolveOperatorInputState(operatorInput);
  const resolved = operatorInputState.ready;
  const phases = buildPhases({
    rawCapturePlan,
    externalActionPlan,
    operatorInput,
    resolved
  });

  const runbook = {
    schema_version: "saphnexa-aws-dev-uat-operator-execution-runbook.v1",
    generated_at: currentJstTimestamp(),
    generated_by: "tools/check-aws-dev-uat-operator-execution-runbook.js",
    git_commit_sha: currentGitCommit(),
    runbook_status: resolved ? "ready_for_external_execution" : "requires_resolved_operator_input",
    ready_for_external_execution: resolved,
    external_state_change: false,
    does_not_execute_commands: true,
    source_artifacts: {
      external_action_plan: options.externalActionPlanPath || externalActionPlanPath,
      raw_capture_plan: options.rawCapturePlanPath || rawCapturePlanOutputPath,
      operator_input: operatorInputPath,
      resolved_operator_input: awsDevUatOperatorInputPath
    },
    runtime: {
      environment: rawCapturePlan.environment,
      region: rawCapturePlan.region,
      stack_name: rawCapturePlan.stack_name,
      run_id: rawCapturePlan.run_id
    },
    operator_input: operatorInputState,
    phase_order: [...phaseIds],
    phases,
    blockers: resolved ? [] : ["missing_or_invalid_resolved_operator_input"],
    next_commands: resolved ? [] : [
      `npm run aws:dev-uat:operator-input:check -- --input ${awsDevUatOperatorInputPath} --require-resolved`,
      `npm run aws:dev-uat:operator-runbook:check -- --input ${awsDevUatOperatorInputPath} --require-resolved`
    ],
    evidence_outputs: unique(phases.flatMap((phase) => phase.evidence_outputs)),
    note: "This operator execution runbook does not deploy, migrate, publish, run E2E, run load tests, invoke Bedrock, create releases, or sign checklists. It only records the ordered commands, confirmation gates, stop conditions, and evidence outputs for an operator."
  };

  writeJson(outputPath, runbook);
  return runbook;
}

export function requiredAwsDevUatOperatorExecutionPhaseIds() {
  return [...phaseIds];
}

export function cli(argv = process.argv.slice(2)) {
  const outputPath = valueFor(argv, "--output") || awsDevUatOperatorExecutionRunbookPath;
  const operatorInputPath = valueFor(argv, "--input") || null;
  const runbook = buildAwsDevUatOperatorExecutionRunbook({
    outputPath,
    operatorInputPath: operatorInputPath || undefined
  });
  console.log(`AWS dev/UAT operator execution runbook generated: ${outputPath} (${runbook.runbook_status})`);
}

function resolveOperatorInputState(input) {
  try {
    validateAwsDevUatOperatorInput(input, { requireResolved: true });
  } catch (error) {
    return {
      schema_version: input.schema_version || null,
      input_status: input.input_status || null,
      final_input: input.final_input === true,
      ready: false,
      validation_error: error.message
    };
  }
  return {
    schema_version: input.schema_version,
    input_status: input.input_status,
    final_input: input.final_input,
    ready: true,
    release_git_tag: input.release.git_tag,
    aws_account_id_present: true,
    approved_execution_window_jst: input.operator.approved_execution_window_jst
  };
}

function buildPhases({ rawCapturePlan, externalActionPlan, operatorInput, resolved }) {
  const externalActions = Object.fromEntries(externalActionPlan.actions.map((action) => [action.id, action]));
  return [
    phase({
      id: "release",
      title: "Release tag and GitHub release",
      externalStateChange: true,
      requiredInputs: ["release.commit_sha", "release.git_tag", "release.github_release_url"],
      commands: resolved ? releaseCommands(operatorInput) : actionCommands(externalActions["release-tag"], "release-tag").concat(actionCommands(externalActions["github-release"], "github-release")),
      evidenceOutputs: ["Git tag URL or tag name", "GitHub release URL", "commit SHA"]
    }),
    phase({
      id: "deploy_publish",
      title: "AWS UAT deploy and Docusaurus / Allure publish",
      externalStateChange: true,
      requiredInputs: ["aws.account_id", "publish.admin_artifacts_bucket", "validation.test_run_id"],
      commands: resolved ? deployPublishCommands(operatorInput) : actionCommands(externalActions["aws-deploy-publish"], "aws-deploy-publish"),
      evidenceOutputs: ["AWS account id", "CloudFormation stack id", "published docs URL", "published Allure URL"]
    }),
    phase({
      id: "preflight_capture",
      title: "AWS dev/UAT preflight raw capture",
      externalStateChange: true,
      requiredInputs: ["aws credentials", "runtime.region", "runtime.stack_name", "runtime.run_id"],
      commands: rawCapturePlan.modes.preflight.commands.map((item) => commandFromRawCapture(item, "preflight-capture", resolved)),
      evidenceOutputs: rawCapturePlan.modes.preflight.commands.map((item) => item.output_ref)
    }),
    phase({
      id: "preflight_materialization",
      title: "Preflight raw input materialization and final gate",
      externalStateChange: false,
      requiredInputs: ["raw_inputs.preflight_raw_input_path", "release.git_tag", "release.github_release_url"],
      commands: materializationCommands("preflight", rawCapturePlan.modes.preflight, operatorInput, resolved),
      evidenceOutputs: [
        rawCapturePlan.modes.preflight.raw_input_path,
        rawCapturePlan.modes.preflight.evidence_output_path
      ]
    }),
    phase({
      id: "validation_capture",
      title: "AWS dev/UAT E2E, performance, and RAG quality capture",
      externalStateChange: true,
      requiredInputs: ["validation.test_run_id", "validation.rag_evaluation_run_id", "validation.bedrock_evaluation_job_arn"],
      commands: rawCapturePlan.modes.validation.commands.map((item) => commandFromRawCapture(item, "validation-capture", resolved)),
      evidenceOutputs: rawCapturePlan.modes.validation.commands.map((item) => item.output_ref)
    }),
    phase({
      id: "validation_materialization",
      title: "Validation raw input materialization and final gates",
      externalStateChange: false,
      requiredInputs: ["raw_inputs.validation_raw_input_path", "aws.account_id"],
      commands: materializationCommands("validation", rawCapturePlan.modes.validation, operatorInput, resolved),
      evidenceOutputs: [
        rawCapturePlan.modes.validation.raw_input_path,
        rawCapturePlan.modes.validation.evidence_output_path
      ]
    }),
    phase({
      id: "final_gates",
      title: "Evidence bundle and final readiness gates",
      externalStateChange: false,
      requiredInputs: ["resolved operator input", "preflight evidence", "validation evidence", "execution bridge"],
      commands: finalGateCommands(operatorInput, resolved),
      evidenceOutputs: [
        "dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json",
        "dist/acceptance/aws_dev_uat_final_readiness.json"
      ]
    }),
    phase({
      id: "final_acceptance",
      title: "Defect refresh, final evidence candidate, and checklist signoff",
      externalStateChange: true,
      requiredInputs: ["fresh defect snapshot", "final evidence candidate", "acceptance reviewer signoff"],
      commands: resolved ? finalAcceptanceCommands() : actionCommands(externalActions["defect-snapshot-refresh"], "defect-snapshot-refresh")
        .concat(actionCommands(externalActions["final-evidence-candidate"], "final-evidence-candidate"))
        .concat(actionCommands(externalActions["final-checklist-signoff"], "final-checklist-signoff")),
      evidenceOutputs: [
        "docs/acceptance/defects/open_issues_snapshot.json",
        "docs/acceptance/final/evidence_manifest.json",
        "docs/acceptance/final/acceptance_checklist.csv",
        "final acceptance package"
      ]
    })
  ];
}

function phase({ id, title, externalStateChange, requiredInputs, commands, evidenceOutputs }) {
  return {
    id,
    title,
    requires_confirmation: true,
    stop_on_failure: true,
    external_state_change: externalStateChange,
    required_inputs: requiredInputs,
    commands: commands.map((item, index) => ({
      order: index + 1,
      ...item
    })),
    evidence_outputs: evidenceOutputs
  };
}

function releaseCommands(input) {
  const tag = input.release.git_tag;
  const commit = input.release.commit_sha;
  return [
    command("release-tag-create", `git tag -a ${tag} ${commit} -m "Saphnexa acceptance release ${tag}"`, "release", true, true),
    command("release-tag-push", `git push origin ${tag}`, "release", true, true),
    command("github-release-create", `gh release create ${tag} --target ${commit} --title "Saphnexa ${tag}" --notes "Acceptance release ${tag}"`, "release", true, true)
  ];
}

function deployPublishCommands(input) {
  const bucket = input.publish.admin_artifacts_bucket;
  const testRunId = input.validation.test_run_id;
  return [
    command("cdk-deploy-uat", "cdk deploy --context env=uat", "deploy_publish", true, true),
    command("docs-publish-latest", `aws s3 sync dist/admin/docs/latest/ s3://${bucket}/docs-site/latest/`, "deploy_publish", true, true),
    command("docs-publish-v016", `aws s3 sync dist/admin/docs/versions/v0.16/ s3://${bucket}/docs-site/releases/v0.16/`, "deploy_publish", true, true),
    command("docs-publish-v017", `aws s3 sync dist/admin/docs/versions/v0.17/ s3://${bucket}/docs-site/releases/v0.17/`, "deploy_publish", true, true),
    command("allure-publish-latest", `aws s3 sync dist/admin/test-reports/allure/latest/ s3://${bucket}/test-reports/allure/latest/`, "deploy_publish", true, true),
    command("allure-publish-run", `aws s3 sync dist/admin/test-reports/allure/runs/${testRunId}/ s3://${bucket}/test-reports/allure/runs/${testRunId}/`, "deploy_publish", true, true)
  ];
}

function materializationCommands(mode, modePlan, input, resolved) {
  const resolvedCommands = input.resolved_commands || {};
  const materialize = resolved ? resolvedCommands[`${mode}_materialize`] : modePlan.materialize_command;
  return [
    command(`${mode}-materialize`, materialize, `${mode}_materialization`, resolved, false),
    command(`${mode}-raw-output-check`, resolvedCommandPath(modePlan.raw_output_check_command, input, mode, resolved), `${mode}_materialization`, resolved, false),
    command(`${mode}-raw-input-check`, resolvedCommandPath(modePlan.raw_input_check_command, input, mode, resolved), `${mode}_materialization`, resolved, false),
    command(`${mode}-evidence-build`, resolvedCommandPath(modePlan.build_command, input, mode, resolved), `${mode}_materialization`, resolved, false),
    command(`${mode}-final`, modePlan.final_command, `${mode}_materialization`, true, false)
  ];
}

function finalGateCommands(input, resolved) {
  const resolvedCommands = input.resolved_commands || {};
  return [
    command("resolved-operator-input-check", input.command_templates.resolved_operator_input_check, "final_gates", resolved, false),
    command("evidence-bundle-check", resolved ? resolvedCommands.evidence_bundle : input.command_templates.evidence_bundle, "final_gates", resolved, false),
    command("final-readiness-check", resolved ? resolvedCommands.final_readiness : input.command_templates.final_readiness, "final_gates", resolved, false)
  ];
}

function finalAcceptanceCommands() {
  return [
    command("defect-snapshot-list", "gh issue list --state open --json number,title,labels,state", "final_acceptance", true, true),
    command("acceptance-package-check", "npm run acceptance:package:check", "final_acceptance", true, false),
    command("acceptance-final-manifest-build", "npm run acceptance:final-manifest:build", "final_acceptance", true, false),
    command("acceptance-final-checklist-build", "npm run acceptance:final-checklist:build", "final_acceptance", true, false),
    command("acceptance-final-candidate-check", "npm run acceptance:final-candidate:check", "final_acceptance", true, false),
    command("acceptance-final-build", "npm run acceptance:final:build", "final_acceptance", true, false),
    command("acceptance-final-check", "npm run acceptance:final:check", "final_acceptance", true, false),
    command("acceptance-package-build", "npm run acceptance:package:build", "final_acceptance", true, false)
  ];
}

function commandFromRawCapture(item, source, resolved) {
  return command(item.id, item.command, source, resolved, true, item.output_ref);
}

function actionCommands(action, source) {
  return (action?.candidate_commands || []).map((text, index) => command(`${source}-${index + 1}`, text, source, false, true));
}

function command(id, text, source, resolved, externalStateChange, outputRef = null) {
  return {
    id,
    command: text,
    source,
    resolved,
    external_state_change: externalStateChange,
    output_ref: outputRef
  };
}

function resolvedCommandPath(commandText, input, mode, resolved) {
  if (!resolved) return commandText;
  const rawInputPath = mode === "preflight" ? input.raw_inputs.preflight_raw_input_path : input.raw_inputs.validation_raw_input_path;
  return commandText.replaceAll(`dist/acceptance/raw/aws_dev_uat_${mode}.raw.json`, rawInputPath);
}

function unique(items) {
  return [...new Set(items)];
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
