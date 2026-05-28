import {
  assert,
  parseArgs,
  printHelp,
  requiredEnv,
  requiredHttpsUrl,
  requireEnvironment,
  writeCapture
} from "./aws-dev-uat-capture-helper-lib.js";

const required = [
  "SAPHNEXA_E2E_PASSED_FLOWS",
  "SAPHNEXA_E2E_TOTAL_FLOWS",
  "SAPHNEXA_ALLURE_RUN_URL",
  "SAPHNEXA_CLOUDFRONT_ACCESS_LOG_S3_URI",
  "SAPHNEXA_E2E_SCENARIOS_JSON"
];

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp({ script: "capture-aws-dev-uat-e2e-result.js", env: required });
  process.exit(0);
}

const context = requireEnvironment(args);
const env = requiredEnv(required);
const passedFlows = requiredInteger(env.SAPHNEXA_E2E_PASSED_FLOWS, "SAPHNEXA_E2E_PASSED_FLOWS");
const totalFlows = requiredInteger(env.SAPHNEXA_E2E_TOTAL_FLOWS, "SAPHNEXA_E2E_TOTAL_FLOWS");
const allureRunUrl = requiredHttpsUrl(env.SAPHNEXA_ALLURE_RUN_URL, "SAPHNEXA_ALLURE_RUN_URL");
const scenarios = requiredScenarios(env.SAPHNEXA_E2E_SCENARIOS_JSON);

assert(totalFlows > 0, "SAPHNEXA_E2E_TOTAL_FLOWS must be greater than 0");
assert(passedFlows === totalFlows, "all AWS dev/UAT E2E flows must pass");
assert(scenarios.length === totalFlows, "SAPHNEXA_E2E_SCENARIOS_JSON length must match total flows");
assert(/^s3:\/\/[^/]+\/.+/.test(env.SAPHNEXA_CLOUDFRONT_ACCESS_LOG_S3_URI), "SAPHNEXA_CLOUDFRONT_ACCESS_LOG_S3_URI must be an s3:// URI");

writeCapture({
  schema_version: "saphnexa-aws-dev-uat-e2e-result.raw.v1",
  ...context,
  status: "captured",
  passed_flows: passedFlows,
  total_flows: totalFlows,
  pass_rate: 1,
  allure_run_url: allureRunUrl,
  cloudfront_access_log_s3_uri: env.SAPHNEXA_CLOUDFRONT_ACCESS_LOG_S3_URI,
  scenarios
});

function requiredInteger(value, label) {
  assert(/^\d+$/.test(value), `${label} must be an integer`);
  return Number(value);
}

function requiredScenarios(value) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    throw new Error(`SAPHNEXA_E2E_SCENARIOS_JSON must be valid JSON: ${error.message}`);
  }
  assert(Array.isArray(parsed), "SAPHNEXA_E2E_SCENARIOS_JSON must be an array");
  for (const item of parsed) {
    assert(typeof item.id === "string" && item.id.trim().length > 0, "E2E scenario id is required");
    assert(item.status === "passed", `E2E scenario must pass: ${item.id}`);
    assert(["general_user", "admin"].includes(item.role), `E2E scenario role mismatch: ${item.id}`);
  }
  return parsed;
}
