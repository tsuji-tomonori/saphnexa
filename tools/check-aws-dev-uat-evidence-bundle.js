import { checkAwsDevUatEvidenceBundle } from "./aws-dev-uat-evidence-bundle.js";

const args = process.argv.slice(2);
const options = {
  preflightRawInputPath: valueFor(args, "--preflight-raw-input"),
  validationRawInputPath: valueFor(args, "--validation-raw-input"),
  preflightEvidencePath: valueFor(args, "--preflight-evidence"),
  validationEvidencePath: valueFor(args, "--validation-evidence"),
  executionBridgePath: valueFor(args, "--execution-bridge"),
  outputPath: valueFor(args, "--output"),
  allowFixtureText: args.includes("--allow-fixture-text")
};

if (!options.preflightRawInputPath || !options.validationRawInputPath || !options.preflightEvidencePath || !options.validationEvidencePath) {
  console.error([
    "Usage: node tools/check-aws-dev-uat-evidence-bundle.js",
    "--preflight-raw-input <path>",
    "--validation-raw-input <path>",
    "--preflight-evidence <path>",
    "--validation-evidence <path>",
    "[--execution-bridge <path>]",
    "[--output <manifest.json>]",
    "[--allow-fixture-text]"
  ].join(" "));
  process.exit(1);
}

const manifest = checkAwsDevUatEvidenceBundle(options);
console.log(`AWS dev/UAT evidence bundle check passed (${manifest.artifact_count} artifacts)`);

function valueFor(values, name) {
  const index = values.indexOf(name);
  if (index < 0) return null;
  return values[index + 1] || null;
}
