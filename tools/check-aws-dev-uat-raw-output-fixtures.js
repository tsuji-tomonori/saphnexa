import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { checkAwsDevUatRawOutputs, writeText } from "./aws-dev-uat-raw-output-checker.js";
import { assert, readJson } from "./lib.js";

const tmpRoot = mkdtempSync(join(tmpdir(), "saphnexa-aws-dev-uat-raw-output-fixture-"));

try {
  checkAwsDevUatRawOutputs("preflight", "docs/acceptance/evidence/aws_dev_uat_preflight.capture.sample.json", { allowFixtureText: true });
  checkAwsDevUatRawOutputs("validation", "docs/acceptance/evidence/aws_dev_uat_validation.capture.sample.json", { allowFixtureText: true });

  const invalidJsonPath = join(tmpRoot, "invalid-json-input.json");
  const invalidJsonInput = materializeInputWithOutputs("docs/acceptance/evidence/aws_dev_uat_preflight.capture.sample.json", invalidJsonPath);
  setOutputRef(invalidJsonInput, "aws-sts", "raw/invalid.json");
  writeText(invalidJsonPath, `${JSON.stringify(invalidJsonInput, null, 2)}\n`);
  writeText(join(tmpRoot, "raw/invalid.json"), "not-json\n");
  assertThrows(
    () => checkAwsDevUatRawOutputs("preflight", invalidJsonPath, { allowFixtureText: true }),
    "must be valid JSON"
  );

  const emptyTextPath = join(tmpRoot, "empty-text-input.json");
  const emptyTextInput = materializeInputWithOutputs("docs/acceptance/evidence/aws_dev_uat_validation.capture.sample.json", emptyTextPath);
  setOutputRef(emptyTextInput, "cloudfront-access-log", "raw/empty.txt");
  writeText(emptyTextPath, `${JSON.stringify(emptyTextInput, null, 2)}\n`);
  writeText(join(tmpRoot, "raw/empty.txt"), "\n");
  assertThrows(
    () => checkAwsDevUatRawOutputs("validation", emptyTextPath, { allowFixtureText: true }),
    "must not be empty"
  );

  assertThrows(
    () => checkAwsDevUatRawOutputs("preflight", "docs/acceptance/evidence/aws_dev_uat_preflight.capture.sample.json"),
    "placeholder/sample/local text"
  );

  console.log("AWS dev/UAT raw output fixture check passed");
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
  return input;
}

function setOutputRef(input, commandId, outputRef) {
  for (const command of input.capture_provenance.commands) {
    if (command.id === commandId) command.output_ref = outputRef;
  }
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
