import {
  optionalEnv,
  parseArgs,
  printHelp,
  probeUrl,
  requiredEnv,
  requiredHttpsUrl,
  requireEnvironment,
  writeCapture
} from "./aws-dev-uat-capture-helper-lib.js";

const required = [
  "SAPHNEXA_DOCUSAURUS_LATEST_URL",
  "SAPHNEXA_DOCUSAURUS_VERSION_URL",
  "SAPHNEXA_ALLURE_LATEST_URL"
];

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp({
    script: "capture-admin-artifacts-smoke.js",
    env: [...required, "SAPHNEXA_CLOUDFRONT_COOKIE (optional for signed-cookie protected artifacts)"]
  });
  process.exit(0);
}

const context = requireEnvironment(args);
const env = requiredEnv(required);
const cookie = optionalEnv("SAPHNEXA_CLOUDFRONT_COOKIE");

const docusaurusLatestUrl = requiredHttpsUrl(env.SAPHNEXA_DOCUSAURUS_LATEST_URL, "SAPHNEXA_DOCUSAURUS_LATEST_URL");
const docusaurusVersionUrl = requiredHttpsUrl(env.SAPHNEXA_DOCUSAURUS_VERSION_URL, "SAPHNEXA_DOCUSAURUS_VERSION_URL");
const allureLatestUrl = requiredHttpsUrl(env.SAPHNEXA_ALLURE_LATEST_URL, "SAPHNEXA_ALLURE_LATEST_URL");

const docusaurusLatest = await probeUrl(docusaurusLatestUrl, { method: "GET", cookie });
const docusaurusVersion = await probeUrl(docusaurusVersionUrl, { method: "GET", cookie });
const allureLatest = await probeUrl(allureLatestUrl, { method: "GET", cookie });
const probes = [docusaurusLatest, docusaurusVersion, allureLatest];

writeCapture({
  schema_version: "saphnexa-admin-artifacts-smoke.raw.v1",
  ...context,
  status: probes.every((item) => item.ok) ? "captured" : "failed",
  signed_cookie_supplied: Boolean(cookie),
  docusaurus_latest_url: docusaurusLatestUrl,
  docusaurus_latest_probe: docusaurusLatest,
  docusaurus_version_url: docusaurusVersionUrl,
  docusaurus_version_probe: docusaurusVersion,
  allure_latest_url: allureLatestUrl,
  allure_latest_probe: allureLatest
});
