import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { buildAwsDevUatPreflightRawInput } from "./aws-dev-uat-preflight-raw-input-materializer.js";
import { checkAwsDevUatRawInput } from "./aws-dev-uat-raw-input-checker.js";
import { buildAwsDevUatRawInputScaffolds } from "./aws-dev-uat-raw-input-scaffold.js";
import { checkAwsDevUatRawOutputs } from "./aws-dev-uat-raw-output-checker.js";
import { assert, readJson } from "./lib.js";

const sampleAccountId = ["123456", "789012"].join("");
const tmpRoot = mkdtemp("saphnexa-aws-dev-uat-preflight-raw-input-");

try {
  const scaffoldPath = join(tmpRoot, "preflight.scaffold.json");
  buildAwsDevUatRawInputScaffolds({
    preflightOutputPath: scaffoldPath,
    validationOutputPath: join(tmpRoot, "validation.scaffold.json"),
    planOutputPath: join(tmpRoot, "raw-capture-plan.json")
  });
  copyRawOutputs(tmpRoot);

  const outputPath = join(tmpRoot, "preflight.raw.json");
  const rawInput = materialize(scaffoldPath, outputPath);
  assert(rawInput.aws.account_id_parts.join("") === sampleAccountId, "preflight materializer must preserve AWS account from STS");
  assert(rawInput.cloudformation.outputs.ApiEndpoint === "https://api.uat.saphnexa.awsapps.com", "preflight materializer must map CloudFormation outputs");
  assert(rawInput.hono_openapi.route_count === 40, "preflight materializer must map OpenAPI route count");
  assert(rawInput.dsql_flyway.checksum_status === "matched", "preflight materializer must map Flyway checksum");
  assert(!rawInput.cloudformation.outputs.AgentCoreRuntimeArn.includes("sample-account"), "preflight materializer must derive final AgentCore ARN from account id");
  checkAwsDevUatRawOutputs("preflight", outputPath, { allowFixtureText: true });
  checkAwsDevUatRawInput("preflight", outputPath);

  const missingOutputRoot = mkdtemp("saphnexa-aws-dev-uat-preflight-missing-output-");
  try {
    const missingScaffold = join(missingOutputRoot, "preflight.scaffold.json");
    buildAwsDevUatRawInputScaffolds({
      preflightOutputPath: missingScaffold,
      validationOutputPath: join(missingOutputRoot, "validation.scaffold.json"),
      planOutputPath: join(missingOutputRoot, "raw-capture-plan.json")
    });
    copyRawOutputs(missingOutputRoot, { skip: "raw/openapi.json" });
    assertThrows(
      () => materialize(missingScaffold, join(missingOutputRoot, "preflight.raw.json")),
      "hono-openapi raw output missing"
    );
  } finally {
    rmSync(missingOutputRoot, { recursive: true, force: true });
  }

  const missingCfnOutputRoot = mkdtemp("saphnexa-aws-dev-uat-preflight-missing-cfn-output-");
  try {
    const missingCfnScaffold = join(missingCfnOutputRoot, "preflight.scaffold.json");
    buildAwsDevUatRawInputScaffolds({
      preflightOutputPath: missingCfnScaffold,
      validationOutputPath: join(missingCfnOutputRoot, "validation.scaffold.json"),
      planOutputPath: join(missingCfnOutputRoot, "raw-capture-plan.json")
    });
    copyRawOutputs(missingCfnOutputRoot);
    mutateJson(join(missingCfnOutputRoot, "raw/cloudformation-describe-stacks.json"), (data) => {
      data.Stacks[0].Outputs = data.Stacks[0].Outputs.filter((item) => item.OutputKey !== "ApiEndpoint");
    });
    assertThrows(
      () => materialize(missingCfnScaffold, join(missingCfnOutputRoot, "preflight.raw.json")),
      "cloudformation output missing: ApiEndpoint"
    );
  } finally {
    rmSync(missingCfnOutputRoot, { recursive: true, force: true });
  }

  const flywayFailureRoot = mkdtemp("saphnexa-aws-dev-uat-preflight-flyway-failure-");
  try {
    const flywayScaffold = join(flywayFailureRoot, "preflight.scaffold.json");
    buildAwsDevUatRawInputScaffolds({
      preflightOutputPath: flywayScaffold,
      validationOutputPath: join(flywayFailureRoot, "validation.scaffold.json"),
      planOutputPath: join(flywayFailureRoot, "raw-capture-plan.json")
    });
    copyRawOutputs(flywayFailureRoot);
    mutateJson(join(flywayFailureRoot, "raw/flyway-info.json"), (data) => {
      data.checksumStatus = "mismatch";
    });
    assertThrows(
      () => materialize(flywayScaffold, join(flywayFailureRoot, "preflight.raw.json")),
      "flyway checksumStatus must be matched"
    );
  } finally {
    rmSync(flywayFailureRoot, { recursive: true, force: true });
  }

  console.log("AWS dev/UAT preflight raw input materializer check passed");
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}

function materialize(scaffoldPath, outputPath) {
  return buildAwsDevUatPreflightRawInput({
    scaffoldPath,
    outputPath,
    capturedAt: "2026-05-28T14:34:00+09:00",
    gitTag: "v0.17.0-uat.20260528",
    githubReleaseUrl: "https://github.com/tsuji-tomonori/saphnexa/releases/tag/v0.17.0-uat.20260528"
  });
}

function copyRawOutputs(root, options = {}) {
  for (const file of [
    "raw/aws-sts-get-caller-identity.json",
    "raw/cloudformation-describe-stacks.json",
    "raw/cloudformation-list-stack-resources.json",
    "raw/flyway-info.json",
    "raw/openapi.json",
    "raw/edge-realtime-smoke.json",
    "raw/rag-runtime-smoke.json",
    "raw/admin-artifacts-smoke.json"
  ]) {
    if (options.skip === file) continue;
    const target = join(root, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, readFileSync(join("docs/acceptance/evidence", file), "utf8"));
  }
}

function mutateJson(path, mutator) {
  const data = readJson(path);
  mutator(data);
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
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

function mkdtemp(prefix) {
  const path = join(tmpdir(), `${prefix}${process.pid}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(path, { recursive: true });
  return path;
}
