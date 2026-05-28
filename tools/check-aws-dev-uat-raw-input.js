import { checkAwsDevUatRawInput } from "./aws-dev-uat-raw-input-checker.js";

const [mode, ...rest] = process.argv.slice(2);
const input = valueFor(rest, "--input");

if (!["preflight", "validation"].includes(mode) || !input) {
  console.error("Usage: node tools/check-aws-dev-uat-raw-input.js <preflight|validation> --input <raw-input.json>");
  process.exit(1);
}

checkAwsDevUatRawInput(mode, input);
console.log(`AWS dev/UAT ${mode} raw input dry-run check passed: ${input}`);

function valueFor(args, name) {
  const index = args.indexOf(name);
  if (index < 0) return null;
  return args[index + 1] || null;
}
