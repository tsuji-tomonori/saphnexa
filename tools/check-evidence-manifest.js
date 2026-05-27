import { assert, readJson } from "./lib.js";

const schema = readJson("docs/acceptance/evidence/evidence_manifest.schema.json");
const manifest = readJson("docs/acceptance/evidence/evidence_manifest.example.json");

for (const key of schema.required) {
  assert(Object.prototype.hasOwnProperty.call(manifest, key), `manifest missing required field ${key}`);
}

assert(manifest.system === "Saphnexa", "system must be Saphnexa");
assert(["dev", "uat", "stg", "prod"].includes(manifest.environment), "invalid environment");
assert(manifest.aws_region === "ap-northeast-1", "aws_region must be ap-northeast-1");
assert(/^[0-9]{12}$/.test(manifest.aws_account_id), "aws_account_id must be 12 digits");
assert(/^[a-f0-9]{40}$/.test(manifest.git_commit_sha), "git_commit_sha must be 40 hex chars");
assert(typeof manifest.git_tag === "string" && manifest.git_tag.length > 0, "git_tag is required");
assert(Array.isArray(manifest.cloudformation_stacks) && manifest.cloudformation_stacks.length > 0, "cloudformation_stacks must not be empty");
assert(manifest.db_migration?.checksum_status === "matched", "db migration checksum must be matched");
assert(manifest.cost_estimate?.monthly_usd <= 550, "cost estimate exceeds acceptance limit");

for (const key of ["allure_latest_url", "unit_report_url", "integration_report_url", "e2e_report_url"]) {
  assert(typeof manifest.test_reports[key] === "string" && manifest.test_reports[key].length > 0, `test_reports.${key} is required`);
}

console.log("evidence manifest check passed");
