import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { checkAwsDevUatRawInput } from "./aws-dev-uat-raw-input-checker.js";
import { checkAwsDevUatRawOutputs } from "./aws-dev-uat-raw-output-checker.js";
import { currentGitCommit } from "./git-context.js";
import { assert, currentJstTimestamp, readJson } from "./lib.js";

export function checkAwsDevUatEvidenceBundle(options = {}) {
  const required = [
    "preflightRawInputPath",
    "validationRawInputPath",
    "preflightEvidencePath",
    "validationEvidencePath"
  ];
  for (const key of required) assert(options[key], `${key} is required`);
  for (const path of [
    options.preflightRawInputPath,
    options.validationRawInputPath,
    options.preflightEvidencePath,
    options.validationEvidencePath,
    options.executionBridgePath
  ].filter(Boolean)) {
    assertBundleFileExists(path);
  }

  checkAwsDevUatRawOutputs("preflight", options.preflightRawInputPath, { allowFixtureText: options.allowFixtureText });
  checkAwsDevUatRawOutputs("validation", options.validationRawInputPath, { allowFixtureText: options.allowFixtureText });
  checkAwsDevUatRawInput("preflight", options.preflightRawInputPath);
  checkAwsDevUatRawInput("validation", options.validationRawInputPath);
  run("node", ["tools/check-aws-dev-uat-preflight.js", options.preflightEvidencePath, "--require-final"]);
  run("node", ["tools/check-aws-dev-uat-validation.js", options.validationEvidencePath, "--require-final"]);
  run("node", ["tools/check-aws-dev-uat-validation.js", options.validationEvidencePath, "--suite=e2e", "--require-final"]);
  run("node", ["tools/check-aws-dev-uat-validation.js", options.validationEvidencePath, "--suite=performance", "--require-final"]);
  run("node", ["tools/check-aws-dev-uat-validation.js", options.validationEvidencePath, "--suite=rag-quality", "--require-final"]);

  const artifacts = [
    artifact("raw-input", "preflight", options.preflightRawInputPath),
    artifact("raw-input", "validation", options.validationRawInputPath),
    artifact("final-evidence", "preflight", options.preflightEvidencePath),
    artifact("final-evidence", "validation", options.validationEvidencePath),
    ...rawOutputArtifacts("preflight", options.preflightRawInputPath),
    ...rawOutputArtifacts("validation", options.validationRawInputPath)
  ];
  if (options.executionBridgePath) artifacts.push(artifact("execution-bridge", "all", options.executionBridgePath));

  const uniqueArtifacts = dedupeArtifacts(artifacts);
  const manifest = {
    schema_version: "saphnexa-aws-dev-uat-evidence-bundle.v1",
    generated_at: currentJstTimestamp(),
    generated_by: "tools/check-aws-dev-uat-evidence-bundle.js",
    git_commit_sha: currentGitCommit(),
    status: "checked",
    evidence_class: "aws-captured",
    checks: {
      preflight_raw_output: "passed",
      validation_raw_output: "passed",
      preflight_raw_input_dry_run: "passed",
      validation_raw_input_dry_run: "passed",
      preflight_final_gate: "passed",
      validation_final_gate: "passed",
      validation_e2e_suite: "passed",
      validation_performance_suite: "passed",
      validation_rag_quality_suite: "passed"
    },
    artifacts: uniqueArtifacts,
    artifact_count: uniqueArtifacts.length
  };

  if (options.outputPath) writeJson(options.outputPath, manifest);
  return manifest;
}

function rawOutputArtifacts(mode, inputPath) {
  const input = readJson(inputPath);
  return input.capture_provenance.commands.map((command) =>
    artifact("raw-output", mode, resolve(dirname(inputPath), command.output_ref), {
      command_id: command.id,
      output_ref: command.output_ref
    })
  );
}

function artifact(kind, mode, path, extra = {}) {
  const absolutePath = resolve(path);
  assertBundleFileExists(path);
  const body = readFileSync(absolutePath);
  return {
    kind,
    mode,
    path,
    size_bytes: body.length,
    sha256: createHash("sha256").update(body).digest("hex"),
    ...extra
  };
}

function assertBundleFileExists(path) {
  assert(existsSync(resolve(path)), `bundle artifact missing: ${path}`);
}

function dedupeArtifacts(artifacts) {
  const byKey = new Map();
  for (const item of artifacts) {
    const key = resolve(item.path);
    if (!byKey.has(key)) byKey.set(key, item);
  }
  return [...byKey.values()];
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${(result.stderr || result.stdout).trim()}`);
  }
}
