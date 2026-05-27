import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { currentGitCommit } from "./git-context.js";
import { readJson } from "./lib.js";

export const finalEvidenceManifestPath = "docs/acceptance/final/evidence_manifest.json";
export const finalEvidenceManifestInputPath = "docs/acceptance/final/evidence-manifest-input.uat.json";
export const finalManifestCloudFormationInventoryPath = "docs/acceptance/cloudformation/cloudformation_inventory.uat.json";

export function buildFinalEvidenceManifestFromFile(options = {}) {
  const inputPath = options.inputPath || finalEvidenceManifestInputPath;
  const inventoryPath = options.cloudFormationInventoryPath || finalManifestCloudFormationInventoryPath;
  const outputPath = options.outputPath || finalEvidenceManifestPath;
  const manifest = buildFinalEvidenceManifest({
    input: readJson(inputPath),
    inventory: readJson(inventoryPath),
    gitCommitSha: options.gitCommitSha || currentGitCommit(),
    packageJson: readJson("package.json")
  });
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

export function buildFinalEvidenceManifest({ input, inventory, gitCommitSha, packageJson }) {
  validateInput(input);
  validateInventory(inventory);
  const stackArn = parseCloudFormationStackArn(inventory.stack_id);
  assert(stackArn?.accountId === input.aws_account_id, "manifest input aws_account_id must match CloudFormation inventory stack account");
  assert(stackArn?.region === inventory.aws_region, "CloudFormation inventory stack ARN region must match inventory region");
  assert(stackArn?.stackName === inventory.stack_name, "CloudFormation inventory stack ARN name must match inventory stack_name");

  return {
    system: "Saphnexa",
    environment: "uat",
    aws_region: inventory.aws_region,
    aws_account_id: input.aws_account_id,
    git_commit_sha: gitCommitSha,
    git_tag: input.git_tag,
    github_release_url: input.github_release_url,
    cdk_app_version: packageJson.version,
    cloudformation_stacks: [
      {
        stack_name: inventory.stack_name,
        stack_id: inventory.stack_id
      }
    ],
    db_migration: {
      tool: "Flyway",
      latest_version: input.db_migration.latest_version,
      checksum_status: input.db_migration.checksum_status
    },
    test_reports: input.test_reports,
    docs_site: input.docs_site,
    rag_evaluation: input.rag_evaluation,
    cost_estimate: input.cost_estimate
  };
}

function validateInput(input) {
  assert(input && typeof input === "object" && !Array.isArray(input), "manifest input must be an object");
  for (const key of [
    "aws_account_id",
    "git_tag",
    "github_release_url",
    "db_migration",
    "test_reports",
    "docs_site",
    "rag_evaluation",
    "cost_estimate"
  ]) {
    assert(Object.prototype.hasOwnProperty.call(input, key), `manifest input missing ${key}`);
  }
  assert(/^[0-9]{12}$/.test(input.aws_account_id), "manifest input aws_account_id must be a 12 digit AWS account id");
  assertFinalText(input.git_tag, "manifest input git_tag");
  assertFinalText(input.github_release_url, "manifest input github_release_url");
  assertFinalText(input.db_migration?.latest_version, "manifest input db_migration.latest_version");
  assert(input.db_migration?.checksum_status === "matched", "manifest input db_migration.checksum_status must be matched");
  for (const key of ["allure_latest_url", "unit_report_url", "integration_report_url", "e2e_report_url"]) {
    assertFinalText(input.test_reports?.[key], `manifest input test_reports.${key}`);
  }
  for (const key of ["latest_url", "version_url"]) {
    assertFinalText(input.docs_site?.[key], `manifest input docs_site.${key}`);
  }
  assertFinalText(input.rag_evaluation?.evaluation_run_id, "manifest input rag_evaluation.evaluation_run_id");
  assertFinalText(input.rag_evaluation?.report_url, "manifest input rag_evaluation.report_url");
  assert(typeof input.cost_estimate?.monthly_usd === "number", "manifest input cost_estimate.monthly_usd must be a number");
  assert(input.cost_estimate.monthly_usd >= 0 && input.cost_estimate.monthly_usd <= 550, "manifest input cost_estimate.monthly_usd must be between 0 and 550");
  assertFinalText(input.cost_estimate?.assumption, "manifest input cost_estimate.assumption");
}

function validateInventory(inventory) {
  assert(inventory?.schema_version === "saphnexa-cloudformation-inventory.v1", "CloudFormation inventory schema mismatch");
  assert(inventory.source === "aws-cloudformation-inventory", "CloudFormation inventory must come from AWS source");
  assert(inventory.final_acceptance_eligible === true, "CloudFormation inventory must be final acceptance eligible");
  assert(inventory.aws_capture_required === false, "CloudFormation inventory must not require more AWS capture");
  assertFinalText(inventory.stack_name, "CloudFormation inventory stack_name");
  assertFinalText(inventory.stack_id, "CloudFormation inventory stack_id");
  assertFinalText(inventory.aws_region, "CloudFormation inventory aws_region");
}

function assertFinalText(value, label) {
  assert(typeof value === "string" && value.trim().length > 0, `${label} must be populated`);
  assert(!/pending|example|draft|placeholder|not-for-acceptance/i.test(value), `${label} must be final text`);
}

function parseCloudFormationStackArn(value) {
  const match = /^arn:aws:cloudformation:([^:]+):([0-9]{12}):stack\/([^/]+)\/.+$/.exec(value || "");
  if (!match) return null;
  return { region: match[1], accountId: match[2], stackName: match[3] };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
