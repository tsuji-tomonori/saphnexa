import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  buildAwsDevUatPreflightEvidence,
  buildAwsDevUatValidationEvidence
} from "./aws-dev-uat-evidence-builders.js";
import { assert, readJson } from "./lib.js";

export function checkAwsDevUatRawInput(mode, inputPath) {
  assert(["preflight", "validation"].includes(mode), "mode must be preflight or validation");
  assert(inputPath, "raw input path is required");
  const rawInput = readJson(inputPath);
  assertFinalizedRawInput(rawInput, mode);

  const tmpRoot = mkdtempSync(join(tmpdir(), `saphnexa-aws-dev-uat-${mode}-raw-input-`));
  try {
    const outputPath = join(tmpRoot, `${mode}.evidence.json`);
    if (mode === "preflight") {
      buildAwsDevUatPreflightEvidence(inputPath, outputPath);
      run("node", ["tools/check-aws-dev-uat-preflight.js", outputPath, "--require-final"]);
    } else {
      buildAwsDevUatValidationEvidence(inputPath, outputPath);
      for (const suite of ["all", "e2e", "performance", "rag-quality"]) {
        const args = ["tools/check-aws-dev-uat-validation.js", outputPath, "--require-final"];
        if (suite !== "all") args.push(`--suite=${suite}`);
        run("node", args);
      }
    }
    return readJson(outputPath);
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
}

function assertFinalizedRawInput(rawInput, mode) {
  assert(rawInput.schema_version !== "saphnexa-aws-dev-uat-raw-input-scaffold.v1", `${mode} raw input scaffold must be finalized before dry-run`);
  assert(rawInput.scaffold_status === undefined, `${mode} raw input must not keep scaffold_status`);
  assert(rawInput.final_evidence !== false, `${mode} raw input must not keep final_evidence=false`);
  assert(rawInput.capture_provenance && typeof rawInput.capture_provenance === "object", `${mode} capture_provenance is required`);
  assert(Array.isArray(rawInput.capture_provenance.commands), `${mode} capture_provenance.commands must be an array`);
  for (const command of rawInput.capture_provenance.commands) {
    assert(command.status === "captured", `${mode} capture_provenance.commands.${command.id}.status must be captured`);
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${(result.stderr || result.stdout).trim()}`);
  }
}

export function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}
