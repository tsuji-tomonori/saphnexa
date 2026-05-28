import {
  buildAwsDevUatPreflightEvidence,
  buildAwsDevUatValidationEvidence,
  preflightEvidenceOutputPath,
  validationEvidenceOutputPath
} from "./aws-dev-uat-evidence-builders.js";

const [mode, ...rest] = process.argv.slice(2);
const input = valueFor(rest, "--input");
const output = valueFor(rest, "--output");

if (!["preflight", "validation"].includes(mode) || !input) {
  console.error("Usage: node tools/build-aws-dev-uat-evidence.js <preflight|validation> --input <raw-evidence.json> [--output <evidence.json>]");
  process.exit(1);
}

if (mode === "preflight") {
  const path = output || preflightEvidenceOutputPath;
  buildAwsDevUatPreflightEvidence(input, path);
  console.log(`AWS dev/UAT preflight evidence generated: ${path}`);
} else {
  const path = output || validationEvidenceOutputPath;
  buildAwsDevUatValidationEvidence(input, path);
  console.log(`AWS dev/UAT validation evidence generated: ${path}`);
}

function valueFor(args, name) {
  const index = args.indexOf(name);
  if (index < 0) return null;
  return args[index + 1] || null;
}
