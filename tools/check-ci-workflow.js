import { assert, readText } from "./lib.js";

const workflow = readText(".github/workflows/ci.yml");
const requiredJobs = [
  "lint",
  "typecheck",
  "unit",
  "integration",
  "e2e",
  "cdk-synth",
  "cdk-diff",
  "security-scan",
  "license-scan",
  "contract-generation-diff"
];

for (const job of requiredJobs) {
  assert(new RegExp(`^  ${job}:`, "m").test(workflow), `missing CI job ${job}`);
}

for (const command of [
  "npm run lint",
  "npm run typecheck",
  "npm test",
  "npm run test:integration:local",
  "npm run test:e2e:local",
  "npm run cdk:synth:local",
  "npm run cdk:diff:local",
  "npm run security:scan",
  "npm run license:scan",
  "npm run test:contract"
]) {
  assert(workflow.includes(command), `workflow missing command: ${command}`);
}

console.log("CI workflow check passed");
