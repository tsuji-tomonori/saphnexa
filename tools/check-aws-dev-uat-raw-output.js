import { checkAwsDevUatRawOutputs } from "./aws-dev-uat-raw-output-checker.js";

const [mode, ...rest] = process.argv.slice(2);
const input = valueFor(rest, "--input");
const allowFixtureText = rest.includes("--allow-fixture-text");

if (!["preflight", "validation"].includes(mode) || !input) {
  console.error("Usage: node tools/check-aws-dev-uat-raw-output.js <preflight|validation> --input <raw-input.json> [--allow-fixture-text]");
  process.exit(1);
}

const result = checkAwsDevUatRawOutputs(mode, input, { allowFixtureText });
console.log(`AWS dev/UAT ${mode} raw output check passed: ${input} (${result.checked_count} files)`);

function valueFor(args, name) {
  const index = args.indexOf(name);
  if (index < 0) return null;
  return args[index + 1] || null;
}
