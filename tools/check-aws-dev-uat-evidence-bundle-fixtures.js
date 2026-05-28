import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { buildAwsDevUatPreflightEvidence, buildAwsDevUatValidationEvidence } from "./aws-dev-uat-evidence-builders.js";
import { checkAwsDevUatEvidenceBundle } from "./aws-dev-uat-evidence-bundle.js";
import { assert, readJson } from "./lib.js";

const tmpRoot = mkdtempSync(join(tmpdir(), "saphnexa-aws-dev-uat-evidence-bundle-"));

try {
  const preflightRawInputPath = join(tmpRoot, "aws_dev_uat_preflight.capture.sample.json");
  const validationRawInputPath = join(tmpRoot, "aws_dev_uat_validation.capture.sample.json");
  materializeInputWithOutputs("docs/acceptance/evidence/aws_dev_uat_preflight.capture.sample.json", preflightRawInputPath);
  materializeInputWithOutputs("docs/acceptance/evidence/aws_dev_uat_validation.capture.sample.json", validationRawInputPath);

  const preflightEvidencePath = join(tmpRoot, "aws_dev_uat_preflight.json");
  const validationEvidencePath = join(tmpRoot, "aws_dev_uat_validation.json");
  const manifestPath = join(tmpRoot, "aws_dev_uat_evidence_bundle_manifest.json");
  buildAwsDevUatPreflightEvidence(preflightRawInputPath, preflightEvidencePath);
  buildAwsDevUatValidationEvidence(validationRawInputPath, validationEvidencePath);

  const manifest = checkAwsDevUatEvidenceBundle({
    preflightRawInputPath,
    validationRawInputPath,
    preflightEvidencePath,
    validationEvidencePath,
    outputPath: manifestPath,
    allowFixtureText: true
  });
  const written = readJson(manifestPath);
  assert(JSON.stringify(manifest) === JSON.stringify(written), "written bundle manifest must match returned manifest");
  assert(written.schema_version === "saphnexa-aws-dev-uat-evidence-bundle.v1", "bundle schema mismatch");
  assert(written.artifact_count >= 18, "bundle manifest must include raw inputs, raw outputs, and final evidence");
  for (const item of written.artifacts) {
    assert(/^[a-f0-9]{64}$/.test(item.sha256), `artifact sha256 mismatch: ${item.path}`);
    assert(item.size_bytes > 0, `artifact size must be positive: ${item.path}`);
  }

  assertThrows(
    () => checkAwsDevUatEvidenceBundle({
      preflightRawInputPath,
      validationRawInputPath,
      preflightEvidencePath,
      validationEvidencePath: join(tmpRoot, "missing-validation.json"),
      allowFixtureText: true
    }),
    "bundle artifact missing"
  );

  console.log("AWS dev/UAT evidence bundle fixture check passed");
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

function writeText(path, body) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}

function assertThrows(fn, message) {
  try {
    fn();
  } catch (error) {
    assert(String(error.message).includes(message), `expected error to include ${message}: ${error.message}`);
    return;
  }
  throw new Error(`expected function to throw: ${message}`);
}
