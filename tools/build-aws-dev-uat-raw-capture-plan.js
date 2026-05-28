import { buildAwsDevUatRawCapturePlan, rawCapturePlanOutputPath } from "./aws-dev-uat-raw-capture-plan.js";

const args = process.argv.slice(2);
const output = valueFor(args, "--output") || rawCapturePlanOutputPath;

const plan = buildAwsDevUatRawCapturePlan({
  environment: valueFor(args, "--env") || "uat",
  region: valueFor(args, "--region") || "ap-northeast-1",
  stackName: valueFor(args, "--stack-name") || null,
  runId: valueFor(args, "--run-id") || null,
  captureRoot: valueFor(args, "--capture-root") || null,
  outputPath: output
});

console.log(`AWS dev/UAT raw capture plan generated: ${output} (${plan.environment}, ${plan.stack_name})`);

function valueFor(items, name) {
  const index = items.indexOf(name);
  if (index < 0) return null;
  return items[index + 1] || null;
}
