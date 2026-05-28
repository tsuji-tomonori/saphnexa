import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateAwsDevUatValidationEvidence } from "./check-aws-dev-uat-validation.js";
import { assert, readJson } from "./lib.js";

const fixturePath = "docs/acceptance/evidence/aws_dev_uat_validation.example.json";
const fixture = readJson(fixturePath);
const root = mkdtempSync(join(tmpdir(), "saphnexa-aws-dev-uat-validation-"));

runChecker([fixturePath], true);
runChecker([fixturePath, "--suite=e2e"], true);
runChecker([fixturePath, "--suite=performance"], true);
runChecker([fixturePath, "--suite=rag-quality"], true);
runChecker([fixturePath, "--require-final"], false);

const badE2e = writeFixture("bad-e2e.json", {
  ...fixture,
  e2e: { ...fixture.e2e, failed_count: 1, passed_count: 5, pass_rate: 0.83 }
});
runChecker([badE2e, "--suite=e2e"], false);

const badPerformance = writeFixture("bad-performance.json", {
  ...fixture,
  performance: {
    ...fixture.performance,
    metrics: { ...fixture.performance.metrics, non_ai_api_p95_ms: 801 }
  }
});
runChecker([badPerformance, "--suite=performance"], false);

const badRagQuality = writeFixture("bad-rag-quality.json", {
  ...fixture,
  rag_quality: {
    ...fixture.rag_quality,
    metrics: { ...fixture.rag_quality.metrics, unsupported_claim_rate: 0.03 }
  }
});
runChecker([badRagQuality, "--suite=rag-quality"], false);

console.log("AWS dev/UAT validation fixture check passed");

function writeFixture(name, body) {
  const path = join(root, name);
  writeFileSync(path, `${JSON.stringify(body, null, 2)}\n`);
  return path;
}

function runChecker(args, expectPass) {
  const path = args.find((item) => !item.startsWith("--"));
  const suiteArg = args.find((item) => item.startsWith("--suite="));
  const options = {
    path,
    requireFinal: args.includes("--require-final"),
    suite: suiteArg ? suiteArg.split("=")[1] : "all"
  };
  let passed = false;
  let output = "";
  try {
    validateAwsDevUatValidationEvidence(readJson(path), options);
    passed = true;
  } catch (error) {
    passed = false;
    output = error.message || "";
  }
  assert(passed === expectPass, `checker expectation mismatch for ${args.join(" ")}: expected ${expectPass ? "pass" : "fail"}\n${output}`);
}
