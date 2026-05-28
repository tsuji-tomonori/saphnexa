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
  "SAPHNEXA_ALLURE_RUN_URL"
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

assert(totalFlows > 0, "SAPHNEXA_E2E_TOTAL_FLOWS must be greater than 0");
assert(passedFlows === totalFlows, "all AWS dev/UAT E2E flows must pass");

writeCapture({
  schema_version: "saphnexa-aws-dev-uat-e2e-result.raw.v1",
  ...context,
  status: "captured",
  passed_flows: passedFlows,
  total_flows: totalFlows,
  pass_rate: 1,
  allure_run_url: allureRunUrl
});

function requiredInteger(value, label) {
  assert(/^\d+$/.test(value), `${label} must be an integer`);
  return Number(value);
}
