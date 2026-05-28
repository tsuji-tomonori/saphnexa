import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { buildAwsDevUatRawCapturePlan } from "./aws-dev-uat-raw-capture-plan.js";
import { buildAwsDevUatFinalReadiness } from "./aws-dev-uat-final-readiness.js";
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
  writeBridge(bridgePath, "not_probed");

  const blocked = buildAwsDevUatFinalReadiness({
    outputPath: join(tmpRoot, "blocked-readiness.json"),
    rawCapturePlanPath: planPath,
    rawCapturePlan: plan,
    executionBridgePath: bridgePath,
    executionBridge: readJson(bridgePath),
    evidenceBundleManifestPath: join(tmpRoot, "missing", "aws_dev_uat_evidence_bundle_manifest.json")
  });
  validateAwsDevUatFinalReadiness(blocked);
  assert(blocked.ready === false, "missing evidence fixture must not be ready");
  assert(blocked.blockers.includes("aws_identity_not_probed"), "blocked fixture must include AWS identity blocker");
  assert(blocked.blockers.includes("missing_preflight_raw_input"), "blocked fixture must include preflight raw input blocker");
  assert(blocked.blockers.includes("missing_validation_raw_input"), "blocked fixture must include validation raw input blocker");
  assert(blocked.next_commands.includes("npm run aws:dev-uat:execution-bridge:probe"), "blocked fixture must suggest AWS identity probe");

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
  checkAwsDevUatEvidenceBundle({
    preflightRawInputPath,
    validationRawInputPath,
    preflightEvidencePath,
    validationEvidencePath,
    executionBridgePath: bridgePath,
    outputPath: bundlePath,
    allowFixtureText: true
  });

  const ready = buildAwsDevUatFinalReadiness({
    outputPath: join(tmpRoot, "ready-readiness.json"),
    rawCapturePlanPath: planPath,
    rawCapturePlan: plan,
    executionBridgePath: bridgePath,
    executionBridge: readJson(bridgePath),
    awsIdentity: authenticatedIdentity(),
    preflightRawInputPath,
    validationRawInputPath,
    preflightEvidencePath,
    validationEvidencePath,
    evidenceBundleManifestPath: bundlePath
  });
  validateAwsDevUatFinalReadiness(ready, { requireReady: true });
  assert(ready.ready === true, "ready fixture must be ready");
  assert(ready.blockers.length === 0, "ready fixture must not have blockers");
  assert(ready.next_commands.length === 0, "ready fixture must not have next commands");

  console.log("AWS dev/UAT final readiness fixture check passed");
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
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
