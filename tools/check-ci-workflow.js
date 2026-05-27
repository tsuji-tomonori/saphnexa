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
  "admin-artifacts",
  "quality-gates",
  "db-observability",
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
  "npm run admin-artifacts:build",
  "npm run artifacts:check",
  "npm run coverage:check",
  "npm run ui:check",
  "npm run web:perf:local",
  "npm run perf:api:local",
  "npm run failure:check",
  "npm run rag:quality:check",
  "npm run rag:security:check",
  "npm run rag:perf:local",
  "npm run db:migration:check",
  "npm run db:integrity:check",
  "npm run search:local:check",
  "npm run observability:check",
  "npm run test:contract"
]) {
  assert(workflow.includes(command), `workflow missing command: ${command}`);
}

console.log("CI workflow check passed");
