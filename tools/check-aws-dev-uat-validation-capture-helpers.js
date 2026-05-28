import { spawnSync } from "node:child_process";
import { assert } from "./lib.js";

const helpers = [
  {
    file: "tools/capture-aws-dev-uat-e2e-result.js",
    requiredEnv: "SAPHNEXA_E2E_PASSED_FLOWS",
    validEnv: {
      SAPHNEXA_E2E_PASSED_FLOWS: "6",
      SAPHNEXA_E2E_TOTAL_FLOWS: "6",
      SAPHNEXA_ALLURE_RUN_URL: "https://reports.uat.saphnexa.awsapps.com/allure/runs/run-20260528"
    },
    expectedSchema: "saphnexa-aws-dev-uat-e2e-result.raw.v1"
  },
  {
    file: "tools/capture-aws-dev-uat-performance-result.js",
    requiredEnv: "SAPHNEXA_PERF_NON_AI_API_P95_MS",
    validEnv: {
      SAPHNEXA_PERF_NON_AI_API_P95_MS: "500",
      SAPHNEXA_PERF_ERROR_RATE: "0.001",
      SAPHNEXA_PERF_QUESTION_START_P95_MS: "1500",
      SAPHNEXA_PERF_RAG_FIRST_NOTICE_P95_MS: "4000",
      SAPHNEXA_PERF_FINAL_ANSWER_P95_MS: "45000",
      SAPHNEXA_PERF_TIMEOUT_RATE: "0.001",
      SAPHNEXA_PERF_REPORT_URL: "https://reports.uat.saphnexa.awsapps.com/performance/run-20260528.json"
    },
    expectedSchema: "saphnexa-aws-dev-uat-performance-result.raw.v1"
  },
  {
    file: "tools/capture-aws-dev-uat-rag-quality-result.js",
    requiredEnv: "SAPHNEXA_RAG_GOLDEN_DATASET",
    validEnv: {
      SAPHNEXA_RAG_GOLDEN_DATASET: "saphnexa-golden-v017",
      SAPHNEXA_RAG_EVALUATION_JOB_ID: "rag-eval-run-20260528",
      SAPHNEXA_RAG_BEDROCK_EVALUATION_JOB_ARN: "arn:aws:bedrock:ap-northeast-1:123456789012:evaluation-job/rag-eval-run-20260528",
      SAPHNEXA_RAG_RECALL_AT_10: "0.92",
      SAPHNEXA_RAG_CITATION_PRECISION: "0.95",
      SAPHNEXA_RAG_GROUNDEDNESS: "0.94",
      SAPHNEXA_RAG_REFUSAL_ACCURACY: "0.93",
      SAPHNEXA_RAG_UNSUPPORTED_CLAIM_RATE: "0.02",
      SAPHNEXA_RAG_REPORT_URL: "https://reports.uat.saphnexa.awsapps.com/rag-quality/run-20260528.json"
    },
    expectedSchema: "saphnexa-aws-dev-uat-rag-quality-result.raw.v1"
  }
];

for (const helper of helpers) {
  const help = run(helper.file, ["--help"]);
  assert(help.status === 0, `${helper.file} --help must pass`);
  assert(help.stdout.includes(helper.requiredEnv), `${helper.file} help must document ${helper.requiredEnv}`);

  const missingEnv = run(helper.file, ["--env", "uat", "--run-id", "validation-capture-check"], { env: { PATH: process.env.PATH || "" } });
  assert(missingEnv.status !== 0, `${helper.file} must fail without required env`);
  assert(!missingEnv.stdout.includes('"status": "captured"'), `${helper.file} must not emit captured output without required env`);
  assert((missingEnv.stderr || missingEnv.stdout).includes(helper.requiredEnv), `${helper.file} missing-env error must mention ${helper.requiredEnv}`);

  const valid = run(helper.file, ["--env", "uat", "--run-id", "validation-capture-check"], {
    env: { PATH: process.env.PATH || "", ...helper.validEnv }
  });
  assert(valid.status === 0, `${helper.file} must pass with valid env: ${valid.stderr}`);
  const parsed = JSON.parse(valid.stdout);
  assert(parsed.schema_version === helper.expectedSchema, `${helper.file} schema mismatch`);
  assert(parsed.status === "captured", `${helper.file} must emit captured status`);
}

const failingPerf = run("tools/capture-aws-dev-uat-performance-result.js", ["--env", "uat", "--run-id", "validation-capture-check"], {
  env: {
    PATH: process.env.PATH || "",
    SAPHNEXA_PERF_NON_AI_API_P95_MS: "801",
    SAPHNEXA_PERF_ERROR_RATE: "0.001",
    SAPHNEXA_PERF_QUESTION_START_P95_MS: "1500",
    SAPHNEXA_PERF_RAG_FIRST_NOTICE_P95_MS: "4000",
    SAPHNEXA_PERF_FINAL_ANSWER_P95_MS: "45000",
    SAPHNEXA_PERF_TIMEOUT_RATE: "0.001",
    SAPHNEXA_PERF_REPORT_URL: "https://reports.uat.saphnexa.awsapps.com/performance/run-20260528.json"
  }
});
assert(failingPerf.status !== 0, "performance helper must fail when thresholds are not met");

console.log("AWS dev/UAT validation capture helper check passed");

function run(file, args, options = {}) {
  return spawnSync("node", [file, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options
  });
}
