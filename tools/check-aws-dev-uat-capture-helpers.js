import { spawnSync } from "node:child_process";
import { assert } from "./lib.js";

const helpers = [
  {
    file: "tools/capture-edge-realtime-smoke.js",
    requiredEnv: "SAPHNEXA_CLOUDFRONT_URL"
  },
  {
    file: "tools/capture-rag-runtime-smoke.js",
    requiredEnv: "SAPHNEXA_BEDROCK_KNOWLEDGE_BASE_ID"
  },
  {
    file: "tools/capture-admin-artifacts-smoke.js",
    requiredEnv: "SAPHNEXA_DOCUSAURUS_LATEST_URL"
  }
];

for (const helper of helpers) {
  const help = run(helper.file, ["--help"]);
  assert(help.status === 0, `${helper.file} --help must pass`);
  assert(help.stdout.includes(helper.requiredEnv), `${helper.file} help must document ${helper.requiredEnv}`);

  const missingEnv = run(helper.file, ["--env", "uat", "--run-id", "helper-check"], { env: { PATH: process.env.PATH || "" } });
  assert(missingEnv.status !== 0, `${helper.file} must fail without required env`);
  assert(!missingEnv.stdout.includes('"status": "captured"'), `${helper.file} must not emit captured output without required env`);
  assert((missingEnv.stderr || missingEnv.stdout).includes(helper.requiredEnv), `${helper.file} missing-env error must mention ${helper.requiredEnv}`);
}

console.log("AWS dev/UAT capture helper check passed");

function run(file, args, options = {}) {
  return spawnSync("node", [file, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options
  });
}
