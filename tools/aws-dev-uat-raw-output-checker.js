import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import {
  preflightCaptureCommandIds,
  validationCaptureCommandIds
} from "./aws-dev-uat-evidence-builders.js";
import { assert, readJson } from "./lib.js";

const outputKinds = new Map([
  ...preflightCaptureCommandIds.map((id) => [id, "json"]),
  ...validationCaptureCommandIds.map((id) => [id, id === "cloudfront-access-log" ? "text" : "json"])
]);

export function checkAwsDevUatRawOutputs(mode, inputPath, options = {}) {
  assert(["preflight", "validation"].includes(mode), "mode must be preflight or validation");
  assert(inputPath, "raw input path is required");
  const input = readJson(inputPath);
  const requiredIds = mode === "preflight" ? preflightCaptureCommandIds : validationCaptureCommandIds;
  assert(input.capture_provenance && typeof input.capture_provenance === "object", `${mode} capture_provenance is required`);
  assert(JSON.stringify(input.capture_provenance.required_command_ids || []) === JSON.stringify(requiredIds), `${mode} required_command_ids mismatch`);
  assert(Array.isArray(input.capture_provenance.commands), `${mode} capture_provenance.commands must be an array`);
  const commandsById = new Map(input.capture_provenance.commands.map((item) => [item.id, item]));

  const checked = [];
  for (const id of requiredIds) {
    const command = commandsById.get(id);
    assert(command, `${mode} capture_provenance.commands missing ${id}`);
    assert(command.status === "captured", `${mode}.${id}.status must be captured`);
    assert(typeof command.output_ref === "string" && command.output_ref.trim().length > 0, `${mode}.${id}.output_ref is required`);
    assert(!isAbsolute(command.output_ref), `${mode}.${id}.output_ref must be relative`);
    assert(!command.output_ref.split(/[\\/]/).includes(".."), `${mode}.${id}.output_ref must not traverse directories`);
    const outputPath = resolve(dirname(inputPath), command.output_ref);
    assert(existsSync(outputPath), `${mode}.${id}.output_ref file missing: ${command.output_ref}`);
    const body = readFileSync(outputPath, "utf8");
    assert(body.trim().length > 0, `${mode}.${id}.output_ref file must not be empty`);
    const outputKind = outputKinds.get(id);
    assert(["json", "text"].includes(outputKind), `${mode}.${id}.output kind is unknown`);
    if (outputKind === "json") assertJsonOutput(body, `${mode}.${id}`);
    if (!options.allowFixtureText) assertNoFixtureText(body, `${mode}.${id}.output_ref`);
    checked.push({ id, output_ref: command.output_ref, output_kind: outputKind });
  }

  return {
    mode,
    input_path: inputPath,
    checked_count: checked.length,
    checked
  };
}

function assertJsonOutput(body, label) {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (error) {
    throw new Error(`${label}.output_ref file must be valid JSON: ${error.message}`);
  }
  if (Array.isArray(parsed)) {
    assert(parsed.length > 0, `${label}.output_ref JSON array must not be empty`);
    return;
  }
  assert(parsed && typeof parsed === "object", `${label}.output_ref JSON must be an object or array`);
  assert(Object.keys(parsed).length > 0, `${label}.output_ref JSON object must not be empty`);
}

function assertNoFixtureText(body, label) {
  assert(
    !/(^|[-_:/\s])(pending|placeholder|todo|tbd|dummy|mock|fixture|sample|localhost|127\.0\.0\.1|0\.0\.0\.0)([-_:/\s]|$)/i.test(body),
    `${label} must not contain placeholder/sample/local text`
  );
}

export function writeText(path, body) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}
