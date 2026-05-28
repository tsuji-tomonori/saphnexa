import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkAwsDevUatRawInput, writeJson } from "./aws-dev-uat-raw-input-checker.js";
import { buildAwsDevUatRawInputScaffolds } from "./aws-dev-uat-raw-input-scaffold.js";
import { assert, readJson } from "./lib.js";

const tmpRoot = mkdtempSync(join(tmpdir(), "saphnexa-aws-dev-uat-raw-input-fixture-"));

try {
  checkAwsDevUatRawInput("preflight", "docs/acceptance/evidence/aws_dev_uat_preflight.capture.sample.json");
  checkAwsDevUatRawInput("validation", "docs/acceptance/evidence/aws_dev_uat_validation.capture.sample.json");

  const scaffolds = buildAwsDevUatRawInputScaffolds({
    preflightOutputPath: join(tmpRoot, "preflight.scaffold.json"),
    validationOutputPath: join(tmpRoot, "validation.scaffold.json"),
    planOutputPath: join(tmpRoot, "raw-capture-plan.json")
  });
  assertThrows(
    () => checkAwsDevUatRawInput("preflight", scaffolds.preflight_path),
    "raw input scaffold must be finalized"
  );
  assertThrows(
    () => checkAwsDevUatRawInput("validation", scaffolds.validation_path),
    "raw input scaffold must be finalized"
  );

  const pendingPreflightPath = join(tmpRoot, "preflight-pending.json");
  const pendingPreflight = readJson("docs/acceptance/evidence/aws_dev_uat_preflight.capture.sample.json");
  pendingPreflight.capture_provenance.commands[0].status = "pending_capture";
  writeJson(pendingPreflightPath, pendingPreflight);
  assertThrows(
    () => checkAwsDevUatRawInput("preflight", pendingPreflightPath),
    "status must be captured"
  );

  const pendingValidationPath = join(tmpRoot, "validation-pending.json");
  const pendingValidation = readJson("docs/acceptance/evidence/aws_dev_uat_validation.capture.sample.json");
  pendingValidation.capture_provenance.commands[0].status = "pending_capture";
  writeJson(pendingValidationPath, pendingValidation);
  assertThrows(
    () => checkAwsDevUatRawInput("validation", pendingValidationPath),
    "status must be captured"
  );

  console.log("AWS dev/UAT raw input fixture check passed");
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
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
