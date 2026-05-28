import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { buildExternalAcceptanceActionPlan } from "./external-acceptance-actions.js";
import { buildAwsDevUatRawCapturePlan } from "./aws-dev-uat-raw-capture-plan.js";
import { buildAwsDevUatFinalReadiness } from "./aws-dev-uat-final-readiness.js";
import { buildAwsDevUatOperatorInputScaffold } from "./aws-dev-uat-operator-input.js";
import { buildAwsDevUatOperatorExecutionRunbook } from "./aws-dev-uat-operator-execution-runbook.js";
import { buildAwsDevUatPreflightEvidence, buildAwsDevUatValidationEvidence } from "./aws-dev-uat-evidence-builders.js";
import { checkAwsDevUatEvidenceBundle } from "./aws-dev-uat-evidence-bundle.js";
import { validateAwsDevUatFinalReadiness } from "./check-aws-dev-uat-final-readiness.js";
import { currentGitCommit } from "./git-context.js";
import { assert, currentJstTimestamp, readJson } from "./lib.js";

const tmpRoot = mkdtempSync(join(tmpdir(), "saphnexa-aws-dev-uat-final-readiness-"));
const sampleAccountId = ["123456", "789012"].join("");

try {
  const planPath = join(tmpRoot, "aws_dev_uat_raw_capture_plan.json");
  const captureRoot = join(tmpRoot, "raw");
  const plan = buildAwsDevUatRawCapturePlan({
    outputPath: planPath,
    captureRoot,
    runId: "final-readiness-fixture"
  });
  const bridgePath = join(tmpRoot, "aws_dev_uat_execution_bridge.json");
  const operatorInputPath = join(tmpRoot, "aws_dev_uat_operator_input.json");
  const operatorRunbookPath = join(tmpRoot, "aws_dev_uat_operator_execution_runbook.json");
  const externalActionPlanPath = join(tmpRoot, "external_action_plan.json");
  const externalActionPlan = buildExternalAcceptanceActionPlan(externalActionPlanPath);
  writeBridge(bridgePath, "not_probed");

  const blocked = buildAwsDevUatFinalReadiness({
    outputPath: join(tmpRoot, "blocked-readiness.json"),
    rawCapturePlanPath: planPath,
    rawCapturePlan: plan,
    executionBridgePath: bridgePath,
    executionBridge: readJson(bridgePath),
    operatorInputPath,
    operatorRunbookPath,
    evidenceBundleManifestPath: join(tmpRoot, "missing", "aws_dev_uat_evidence_bundle_manifest.json")
  });
  validateAwsDevUatFinalReadiness(blocked);
  assert(blocked.ready === false, "missing evidence fixture must not be ready");
  assert(blocked.blockers.includes("aws_identity_not_probed"), "blocked fixture must include AWS identity blocker");
  assert(blocked.blockers.includes("missing_preflight_raw_input"), "blocked fixture must include preflight raw input blocker");
  assert(blocked.blockers.includes("missing_validation_raw_input"), "blocked fixture must include validation raw input blocker");
  assert(blocked.blockers.includes("missing_operator_input"), "blocked fixture must include operator input blocker");
  assert(blocked.blockers.includes("missing_operator_runbook"), "blocked fixture must include operator runbook blocker");
  assert(blocked.next_commands.includes("npm run aws:dev-uat:execution-bridge:probe"), "blocked fixture must suggest AWS identity probe");
  assert(blocked.next_commands.includes("npm run aws:dev-uat:raw-capture-plan:check"), "blocked fixture must suggest raw capture plan check");
  assert(blocked.next_commands.includes("npm run aws:dev-uat:raw-input-scaffold:check"), "blocked fixture must suggest raw input scaffold check");
  assert(blocked.next_commands.includes(plan.modes.preflight.materialize_command), "blocked fixture must suggest preflight raw input materialize");
  assert(blocked.next_commands.includes(plan.modes.preflight.raw_output_check_command), "blocked fixture must suggest preflight raw output check");
  assert(blocked.next_commands.includes(plan.modes.preflight.raw_input_check_command), "blocked fixture must suggest preflight raw input check");
  assert(blocked.next_commands.includes(plan.modes.preflight.build_command), "blocked fixture must suggest preflight final evidence build");
  assert(blocked.next_commands.includes(plan.modes.preflight.final_command), "blocked fixture must suggest preflight final gate");
  assert(blocked.next_commands.includes(plan.modes.validation.materialize_command), "blocked fixture must suggest validation raw input materialize");
  assert(blocked.next_commands.includes(plan.modes.validation.raw_output_check_command), "blocked fixture must suggest validation raw output check");
  assert(blocked.next_commands.includes(plan.modes.validation.raw_input_check_command), "blocked fixture must suggest validation raw input check");
  assert(blocked.next_commands.includes(plan.modes.validation.build_command), "blocked fixture must suggest validation final evidence build");
  assert(blocked.next_commands.includes(plan.modes.validation.final_command), "blocked fixture must suggest validation final gate");
  assert(blocked.next_commands.includes("npm run aws:dev-uat:operator-input:build"), "blocked fixture must suggest operator input scaffold build");
  assert(blocked.next_commands.includes("npm run aws:dev-uat:operator-input:check"), "blocked fixture must suggest operator input scaffold check");
  assert(
    blocked.next_commands.includes(`npm run aws:dev-uat:operator-input:check -- --input ${operatorInputPath} --require-resolved`),
    "blocked fixture must suggest resolved operator input check"
  );
  assert(blocked.next_commands.includes("npm run aws:dev-uat:operator-runbook:build"), "blocked fixture must suggest operator runbook build");
  assert(blocked.next_commands.includes("npm run aws:dev-uat:operator-runbook:check"), "blocked fixture must suggest operator runbook check");
  assert(
    blocked.next_commands.includes(`npm run aws:dev-uat:operator-runbook:check -- --input ${operatorInputPath} --require-resolved`),
    "blocked fixture must suggest operator runbook check"
  );

  const operatorInputScaffold = buildAwsDevUatOperatorInputScaffold({
    outputPath: join(tmpRoot, "aws_dev_uat_operator_input.scaffold.json"),
    rawCapturePlanPath: planPath,
    rawCapturePlan: plan
  });
  writeText(operatorInputPath, `${JSON.stringify({ ...operatorInputScaffold, input_status: "requires_operator_values" }, null, 2)}\n`);
  const invalidOperatorInput = buildAwsDevUatFinalReadiness({
    outputPath: join(tmpRoot, "invalid-operator-input-readiness.json"),
    rawCapturePlanPath: planPath,
    rawCapturePlan: plan,
    executionBridgePath: bridgePath,
    executionBridge: readJson(bridgePath),
    operatorInputPath,
    operatorRunbookPath,
    evidenceBundleManifestPath: join(tmpRoot, "missing", "aws_dev_uat_evidence_bundle_manifest.json")
  });
  validateAwsDevUatFinalReadiness(invalidOperatorInput);
  assert(invalidOperatorInput.blockers.includes("invalid_operator_input"), "invalid operator input fixture must block readiness");
  writeText(operatorInputPath, `${JSON.stringify(resolvedOperatorInput(operatorInputScaffold), null, 2)}\n`);
  buildAwsDevUatOperatorExecutionRunbook({
    outputPath: operatorRunbookPath,
    externalActionPlan,
    externalActionPlanPath,
    rawCapturePlan: plan,
    rawCapturePlanPath: planPath,
    operatorInput: operatorInputScaffold,
    operatorInputPath
  });
  const invalidOperatorRunbook = buildAwsDevUatFinalReadiness({
    outputPath: join(tmpRoot, "invalid-operator-runbook-readiness.json"),
    rawCapturePlanPath: planPath,
    rawCapturePlan: plan,
    executionBridgePath: bridgePath,
    executionBridge: readJson(bridgePath),
    operatorInputPath,
    operatorRunbookPath,
    evidenceBundleManifestPath: join(tmpRoot, "missing", "aws_dev_uat_evidence_bundle_manifest.json")
  });
  validateAwsDevUatFinalReadiness(invalidOperatorRunbook);
  assert(invalidOperatorRunbook.blockers.includes("invalid_operator_runbook"), "invalid operator runbook fixture must block readiness");

  writeText(operatorInputPath, `${JSON.stringify({ ...readJson(operatorInputPath), git_commit_sha: "0".repeat(40) }, null, 2)}\n`);
  buildAwsDevUatOperatorExecutionRunbook({
    outputPath: operatorRunbookPath,
    externalActionPlan,
    externalActionPlanPath,
    rawCapturePlan: plan,
    rawCapturePlanPath: planPath,
    operatorInput: resolvedOperatorInput(operatorInputScaffold),
    operatorInputPath
  });
  const staleOperatorInput = buildAwsDevUatFinalReadiness({
    outputPath: join(tmpRoot, "stale-operator-input-readiness.json"),
    rawCapturePlanPath: planPath,
    rawCapturePlan: plan,
    executionBridgePath: bridgePath,
    executionBridge: readJson(bridgePath),
    operatorInputPath,
    operatorRunbookPath,
    evidenceBundleManifestPath: join(tmpRoot, "missing", "aws_dev_uat_evidence_bundle_manifest.json")
  });
  validateAwsDevUatFinalReadiness(staleOperatorInput);
  assert(staleOperatorInput.blockers.includes("stale_operator_input"), "stale operator input fixture must block readiness");
  writeText(operatorInputPath, `${JSON.stringify(resolvedOperatorInput(operatorInputScaffold), null, 2)}\n`);

  buildAwsDevUatOperatorExecutionRunbook({
    outputPath: operatorRunbookPath,
    externalActionPlan,
    externalActionPlanPath,
    rawCapturePlan: plan,
    rawCapturePlanPath: planPath,
    operatorInput: readJson(operatorInputPath),
    operatorInputPath
  });
  const staleRunbook = readJson(operatorRunbookPath);
  writeText(operatorRunbookPath, `${JSON.stringify({ ...staleRunbook, git_commit_sha: "0".repeat(40) }, null, 2)}\n`);
  const staleOperatorRunbook = buildAwsDevUatFinalReadiness({
    outputPath: join(tmpRoot, "stale-operator-runbook-readiness.json"),
    rawCapturePlanPath: planPath,
    rawCapturePlan: plan,
    executionBridgePath: bridgePath,
    executionBridge: readJson(bridgePath),
    operatorInputPath,
    operatorRunbookPath,
    evidenceBundleManifestPath: join(tmpRoot, "missing", "aws_dev_uat_evidence_bundle_manifest.json")
  });
  validateAwsDevUatFinalReadiness(staleOperatorRunbook);
  assert(staleOperatorRunbook.blockers.includes("stale_operator_runbook"), "stale operator runbook fixture must block readiness");

  const preflightRawInputPath = plan.modes.preflight.raw_input_path;
  const validationRawInputPath = plan.modes.validation.raw_input_path;
  materializeInputWithOutputs("docs/acceptance/evidence/aws_dev_uat_preflight.capture.sample.json", preflightRawInputPath);
  materializeInputWithOutputs("docs/acceptance/evidence/aws_dev_uat_validation.capture.sample.json", validationRawInputPath);
  const preflightEvidencePath = join(tmpRoot, "aws_dev_uat_preflight.json");
  const validationEvidencePath = join(tmpRoot, "aws_dev_uat_validation.json");
  const bundlePath = join(tmpRoot, "aws_dev_uat_evidence_bundle_manifest.json");
  buildAwsDevUatPreflightEvidence(preflightRawInputPath, preflightEvidencePath);
  buildAwsDevUatValidationEvidence(validationRawInputPath, validationEvidencePath);
  writeBridge(bridgePath, "authenticated");
  buildAwsDevUatOperatorExecutionRunbook({
    outputPath: operatorRunbookPath,
    externalActionPlan,
    externalActionPlanPath,
    rawCapturePlan: plan,
    rawCapturePlanPath: planPath,
    operatorInput: readJson(operatorInputPath),
    operatorInputPath
  });
  checkAwsDevUatEvidenceBundle({
    preflightRawInputPath,
    validationRawInputPath,
    preflightEvidencePath,
    validationEvidencePath,
    executionBridgePath: bridgePath,
    outputPath: bundlePath,
    allowFixtureText: true
  });

  const invalidBundlePath = join(tmpRoot, "invalid", "aws_dev_uat_evidence_bundle_manifest.json");
  writeText(invalidBundlePath, `${JSON.stringify({ ...readJson(bundlePath), schema_version: "invalid.v1" }, null, 2)}\n`);
  const invalidBundle = buildAwsDevUatFinalReadiness({
    outputPath: join(tmpRoot, "invalid-bundle-readiness.json"),
    rawCapturePlanPath: planPath,
    rawCapturePlan: plan,
    executionBridgePath: bridgePath,
    executionBridge: readJson(bridgePath),
    awsIdentity: authenticatedIdentity(),
    operatorInputPath,
    operatorRunbookPath,
    preflightRawInputPath,
    validationRawInputPath,
    preflightEvidencePath,
    validationEvidencePath,
    evidenceBundleManifestPath: invalidBundlePath
  });
  validateAwsDevUatFinalReadiness(invalidBundle);
  assert(invalidBundle.blockers.includes("invalid_evidence_bundle_manifest"), "invalid bundle fixture must block readiness");
  assert(invalidBundle.evidence_bundle_manifest.required_artifacts_present === true, "invalid bundle fixture must still expose coverage state");
  assert(
    invalidBundle.evidence_bundle_manifest.required_artifacts.every((item) => item.path_matches === true),
    "invalid bundle schema fixture must still expose matching artifact paths"
  );

  const staleBundlePath = join(tmpRoot, "stale", "aws_dev_uat_evidence_bundle_manifest.json");
  writeText(staleBundlePath, `${JSON.stringify({ ...readJson(bundlePath), git_commit_sha: "0".repeat(40) }, null, 2)}\n`);
  const staleBundle = buildAwsDevUatFinalReadiness({
    outputPath: join(tmpRoot, "stale-bundle-readiness.json"),
    rawCapturePlanPath: planPath,
    rawCapturePlan: plan,
    executionBridgePath: bridgePath,
    executionBridge: readJson(bridgePath),
    awsIdentity: authenticatedIdentity(),
    operatorInputPath,
    operatorRunbookPath,
    preflightRawInputPath,
    validationRawInputPath,
    preflightEvidencePath,
    validationEvidencePath,
    evidenceBundleManifestPath: staleBundlePath
  });
  validateAwsDevUatFinalReadiness(staleBundle);
  assert(staleBundle.blockers.includes("stale_evidence_bundle_manifest"), "stale bundle fixture must block readiness");
  assert(!staleBundle.blockers.includes("invalid_evidence_bundle_manifest"), "stale bundle fixture must not be invalid when coverage is complete");

  const mismatchedBundlePath = join(tmpRoot, "mismatched", "aws_dev_uat_evidence_bundle_manifest.json");
  const mismatchedBundleManifest = readJson(bundlePath);
  mismatchedBundleManifest.artifacts = mismatchedBundleManifest.artifacts.map((artifact) =>
    artifact.kind === "raw-input" && artifact.mode === "preflight"
      ? { ...artifact, path: join(tmpRoot, "mismatched", "wrong-preflight.raw.json") }
      : artifact
  );
  writeText(mismatchedBundlePath, `${JSON.stringify(mismatchedBundleManifest, null, 2)}\n`);
  const mismatchedBundle = buildAwsDevUatFinalReadiness({
    outputPath: join(tmpRoot, "mismatched-bundle-readiness.json"),
    rawCapturePlanPath: planPath,
    rawCapturePlan: plan,
    executionBridgePath: bridgePath,
    executionBridge: readJson(bridgePath),
    awsIdentity: authenticatedIdentity(),
    operatorInputPath,
    operatorRunbookPath,
    preflightRawInputPath,
    validationRawInputPath,
    preflightEvidencePath,
    validationEvidencePath,
    evidenceBundleManifestPath: mismatchedBundlePath
  });
  validateAwsDevUatFinalReadiness(mismatchedBundle);
  assert(mismatchedBundle.blockers.includes("invalid_evidence_bundle_manifest"), "mismatched bundle fixture must block readiness");
  assert(mismatchedBundle.evidence_bundle_manifest.required_artifacts_present === false, "mismatched bundle fixture must fail artifact path coverage");
  assert(
    mismatchedBundle.evidence_bundle_manifest.required_artifacts.some(
      (item) => item.kind === "raw-input" && item.mode === "preflight" && item.present === true && item.path_matches === false
    ),
    "mismatched bundle fixture must expose the mismatched artifact path"
  );

  const ready = buildAwsDevUatFinalReadiness({
    outputPath: join(tmpRoot, "ready-readiness.json"),
    rawCapturePlanPath: planPath,
    rawCapturePlan: plan,
    executionBridgePath: bridgePath,
    executionBridge: readJson(bridgePath),
    awsIdentity: authenticatedIdentity(),
    operatorInputPath,
    operatorRunbookPath,
    preflightRawInputPath,
    validationRawInputPath,
    preflightEvidencePath,
    validationEvidencePath,
    evidenceBundleManifestPath: bundlePath
  });
  validateAwsDevUatFinalReadiness(ready, { requireReady: true });
  assert(ready.ready === true, "ready fixture must be ready");
  assert(ready.operator_input.ready === true, "ready fixture must include resolved operator input");
  assert(ready.operator_execution_runbook.ready === true, "ready fixture must include ready operator runbook");
  assert(ready.evidence_bundle_manifest.ready === true, "ready fixture must include ready evidence bundle");
  assert(ready.evidence_bundle_manifest.current_git_commit === true, "ready fixture must include current evidence bundle");
  assert(ready.evidence_bundle_manifest.required_artifacts_present === true, "ready fixture must include bundle artifact coverage");
  assert(
    ready.evidence_bundle_manifest.required_artifacts.every((item) => item.path_matches === true),
    "ready fixture must include matching bundle artifact paths"
  );
  assert(ready.blockers.length === 0, "ready fixture must not have blockers");
  assert(ready.next_commands.length === 0, "ready fixture must not have next commands");

  console.log("AWS dev/UAT final readiness fixture check passed");
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}

function resolvedOperatorInput(input) {
  const copy = JSON.parse(JSON.stringify(input));
  const gitTag = "v0.17.0";
  const releaseUrl = "https://github.com/tsuji-tomonori/saphnexa/releases/tag/v0.17.0";
  const bucket = `saphnexa-uat-${sampleAccountId}-artifacts`;
  const testRunId = "uat-run-20260528-1556";
  const capturedAt = "2026-05-28T15:56:00+09:00";
  copy.input_status = "ready_for_aws_dev_uat_execution";
  copy.final_input = true;
  copy.operator = {
    reviewer: "acceptance-operator",
    approved_execution_window_jst: "2026-05-28T16:30:00+09:00"
  };
  copy.release = {
    commit_sha: input.git_commit_sha,
    git_tag: gitTag,
    github_release_url: releaseUrl
  };
  copy.aws.account_id = sampleAccountId;
  copy.publish = {
    admin_artifacts_bucket: bucket,
    docs_latest_s3_uri: `s3://${bucket}/docs-site/latest/`,
    docs_v017_s3_uri: `s3://${bucket}/docs-site/releases/v0.17/`,
    allure_latest_s3_uri: `s3://${bucket}/test-reports/allure/latest/`,
    allure_run_s3_uri: `s3://${bucket}/test-reports/allure/runs/${testRunId}/`
  };
  copy.validation = {
    test_run_id: testRunId,
    golden_dataset_id: "golden-v0.17",
    rag_evaluation_run_id: `rag-eval-${testRunId}`,
    bedrock_evaluation_job_arn: `arn:aws:bedrock:ap-northeast-1:${sampleAccountId}:evaluation-job/rag-eval-${testRunId}`,
    e2e_allure_run_url: `https://artifacts.uat.saphnexa.awsapps.com/test-reports/allure/runs/${testRunId}/`,
    performance_report_url: `https://artifacts.uat.saphnexa.awsapps.com/performance/${testRunId}.json`,
    rag_quality_report_url: `https://artifacts.uat.saphnexa.awsapps.com/rag-quality/${testRunId}.json`
  };
  copy.resolved_commands = {
    resolved_operator_input_check: copy.command_templates.resolved_operator_input_check,
    preflight_materialize: copy.command_templates.preflight_materialize
      .replace("<capture-jst-timestamp>", capturedAt)
      .replace("<release-tag>", gitTag)
      .replace("<github-release-url>", releaseUrl),
    validation_materialize: copy.command_templates.validation_materialize
      .replace("<capture-jst-timestamp>", capturedAt)
      .replace("<release-tag>", gitTag)
      .replace("<github-release-url>", releaseUrl)
      .replace("<aws-account-id>", sampleAccountId),
    evidence_bundle: copy.command_templates.evidence_bundle
      .replaceAll("<raw-preflight-input.json>", copy.raw_inputs.preflight_raw_input_path)
      .replaceAll("<raw-validation-input.json>", copy.raw_inputs.validation_raw_input_path),
    final_readiness: copy.command_templates.final_readiness
  };
  return copy;
}

function materializeInputWithOutputs(inputPath, targetInputPath) {
  const input = readJson(inputPath);
  for (const command of input.capture_provenance.commands) {
    const sourcePath = resolve(dirname(inputPath), command.output_ref);
    const targetPath = resolve(dirname(targetInputPath), command.output_ref);
    writeText(targetPath, readFileSync(sourcePath, "utf8"));
  }
  writeText(targetInputPath, `${JSON.stringify(input, null, 2)}\n`);
}

function writeBridge(path, status) {
  const authenticated = status === "authenticated";
  writeText(path, `${JSON.stringify({
    schema_version: "saphnexa-aws-dev-uat-execution-bridge.v1",
    generated_at: currentJstTimestamp(),
    generated_by: "tools/check-aws-dev-uat-execution-bridge.js",
    source: {
      git_commit_sha: currentGitCommit()
    },
    readiness: {
      ready_to_run_final_gates: authenticated,
      status: authenticated ? "ready_to_run_final_gates" : "waiting_for_external_execution",
      blockers: authenticated ? [] : ["aws_identity_not_probed"]
    },
    aws_identity: authenticated ? authenticatedIdentity() : {
      status: "not_probed",
      command: "aws sts get-caller-identity --output json",
      reason: "fixture"
    },
    final_evidence: [],
    command_order: [
      "npm run aws:dev-uat:execution-bridge:probe",
      "npm run aws:dev-uat:preflight:final",
      "npm run test:e2e:aws",
      "npm run perf:aws",
      "npm run rag:quality:aws",
      "npm run aws:dev-uat:validation:final"
    ],
    required_inputs: {},
    evidence_mapping: {},
    note: "fixture bridge"
  }, null, 2)}\n`);
}

function authenticatedIdentity() {
  return {
    status: "authenticated",
    command: "aws sts get-caller-identity --output json",
    account_id: sampleAccountId,
    user_id: `AID${sampleAccountId}`,
    arn: `arn:aws:sts::${sampleAccountId}:assumed-role/saphnexa-uat/CodexFixture`
  };
}

function writeText(path, body) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}
