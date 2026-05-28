import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  buildAwsDevUatPreflightEvidence,
  buildAwsDevUatValidationEvidence
} from "./aws-dev-uat-evidence-builders.js";
import { assert, readJson } from "./lib.js";

const tmpRoot = mkdtempSync(join(tmpdir(), "saphnexa-aws-dev-uat-evidence-"));

try {
  const preflightPath = join(tmpRoot, "aws_dev_uat_preflight.json");
  const validationPath = join(tmpRoot, "aws_dev_uat_validation.json");

  buildAwsDevUatPreflightEvidence("docs/acceptance/evidence/aws_dev_uat_preflight.capture.sample.json", preflightPath);
  buildAwsDevUatValidationEvidence("docs/acceptance/evidence/aws_dev_uat_validation.capture.sample.json", validationPath);

  const preflight = readJson(preflightPath);
  const validation = readJson(validationPath);
  assert(preflight.evidence_class === "aws-captured", "preflight builder must output aws-captured evidence");
  assert(validation.evidence_class === "aws-captured", "validation builder must output aws-captured evidence");
  assert(preflight.cloudformation.outputs.ApiEndpoint === "https://api.uat.saphnexa.awsapps.com", "preflight builder must map CloudFormation outputs");
  assert(preflight.hono_openapi.openapi_url === "https://api.uat.saphnexa.awsapps.com/openapi.json", "preflight builder must derive OpenAPI URL");
  assert(validation.preflight.evidence_path === "dist/acceptance/aws_dev_uat_preflight.json", "validation builder preflight path mismatch");

  run("node", ["tools/check-aws-dev-uat-preflight.js", preflightPath, "--require-final"]);
  run("node", ["tools/check-aws-dev-uat-validation.js", validationPath, "--require-final"]);
  run("node", ["tools/check-aws-dev-uat-validation.js", validationPath, "--suite=e2e", "--require-final"]);
  run("node", ["tools/check-aws-dev-uat-validation.js", validationPath, "--suite=performance", "--require-final"]);
  run("node", ["tools/check-aws-dev-uat-validation.js", validationPath, "--suite=rag-quality", "--require-final"]);

  console.log("AWS dev/UAT evidence builder fixture check passed");
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${(result.stderr || result.stdout).trim()}`);
  }
}
