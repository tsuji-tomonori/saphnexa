import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { acceptanceIds, acceptanceItemById } from "./acceptance-ids.js";
import {
  assertSourceChecklistColumns,
  finalCheckedDateColumn,
  finalEvidenceColumn,
  finalResultColumn,
  finalReviewerColumn,
  sourceChecklistValue
} from "./acceptance-checklist-format.js";
import { currentGitCommit, currentGitRepository, gitTagCommit } from "./git-context.js";
import { expectedMajorResourceTypes } from "./cloudformation-inventory.js";
import { readJson, readText } from "./lib.js";

export const finalCandidateStatusPath = "dist/acceptance/final_candidate_status.json";
export const finalEvidenceManifestPath = "docs/acceptance/final/evidence_manifest.json";
export const finalChecklistPath = "docs/acceptance/final/acceptance_checklist.csv";
export const finalCloudFormationInventoryPath = "docs/acceptance/cloudformation/cloudformation_inventory.uat.json";

const candidatePaths = [
  finalEvidenceManifestPath,
  finalChecklistPath,
  finalCloudFormationInventoryPath
];

export function buildFinalEvidenceCandidateStatus(outputPath = finalCandidateStatusPath, options = {}) {
  const paths = {
    evidence_manifest: finalEvidenceManifestPath,
    acceptance_checklist: finalChecklistPath,
    cloudformation_inventory: finalCloudFormationInventoryPath,
    ...(options.candidatePaths || {})
  };
  const missing_files = Object.values(paths).filter((path) => !exists(path));
  const checks = [];
  const errors = [];

  if (missing_files.length === 0) {
    const manifest = validateManifest(paths.evidence_manifest, checks, errors, options);
    validateChecklist(paths.acceptance_checklist, checks, errors, options);
    const cloudFormationInventory = validateCloudFormationInventory(paths.cloudformation_inventory, checks, errors);
    validateManifestCloudFormationConsistency(manifest, cloudFormationInventory, checks, errors);
  }

  const status = {
    schema_version: "saphnexa-final-evidence-candidate-status.v1",
    generated_at: "2026-05-27T12:02:00+09:00",
    generated_by: "tools/check-final-evidence-candidate.js",
    ready: missing_files.length === 0 && errors.length === 0,
    status: missing_files.length > 0 ? "not_ready" : errors.length === 0 ? "ready" : "invalid",
    candidate_paths: paths,
    missing_files,
    checks,
    errors,
    note: "Final candidate files are required for acceptance completion. Missing candidate files are expected during local preflight and must not be treated as final PASS."
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(status, null, 2)}\n`);
  return status;
}

function validateManifest(path, checks, errors, options = {}) {
  const manifest = readJson(path);
  const resolveGitTagCommit = options.resolveGitTagCommit || gitTagCommit;
  const resolveGitRepository = options.resolveGitRepository || currentGitRepository;
  const required = [
    "system",
    "environment",
    "aws_region",
    "aws_account_id",
    "git_commit_sha",
    "git_tag",
    "github_release_url",
    "cloudformation_stacks",
    "db_migration",
    "test_reports",
    "docs_site",
    "rag_evaluation",
    "cost_estimate"
  ];
  for (const key of required) requireField(manifest, key, `manifest.${key}`, errors);

  check(manifest.system === "Saphnexa", "manifest.system", checks, errors, "must be Saphnexa");
  check(manifest.environment === "uat", "manifest.environment", checks, errors, "must be uat");
  check(manifest.aws_region === "ap-northeast-1", "manifest.aws_region", checks, errors, "must be ap-northeast-1");
  check(/^[0-9]{12}$/.test(manifest.aws_account_id || "") && manifest.aws_account_id !== "000000000000", "manifest.aws_account_id", checks, errors, "must be a real 12 digit AWS account id");
  check(/^[a-f0-9]{40}$/.test(manifest.git_commit_sha || "") && !/^0{40}$/.test(manifest.git_commit_sha || ""), "manifest.git_commit_sha", checks, errors, "must be a non-placeholder commit SHA");
  check(manifest.git_commit_sha === currentGitCommit(), "manifest.git_commit_sha_current_ref", checks, errors, "must match current Git ref");
  check(isFinalText(manifest.git_tag), "manifest.git_tag", checks, errors, "must be a final immutable Git tag");
  const tagCommit = resolveGitTagCommit(manifest.git_tag);
  check(Boolean(tagCommit), "manifest.git_tag_ref", checks, errors, "must exist as a Git tag ref");
  check(tagCommit === manifest.git_commit_sha, "manifest.git_tag_commit", checks, errors, "must point to manifest.git_commit_sha");
  check(isUrl(manifest.github_release_url), "manifest.github_release_url", checks, errors, "must be an https GitHub release URL");
  check(isReleaseUrlForTag(manifest.github_release_url, manifest.git_tag), "manifest.github_release_url_git_tag", checks, errors, "must point to the same release tag as manifest.git_tag");
  const releaseRef = parseGitHubReleaseUrl(manifest.github_release_url);
  const currentRepository = resolveGitRepository();
  check(Boolean(currentRepository), "manifest.github_release_url_current_repo_available", checks, errors, "current GitHub repository must be resolvable from remote.origin.url");
  check(releaseRef?.repository === currentRepository, "manifest.github_release_url_repository", checks, errors, "must point to the current GitHub repository release");
  check(isFinalText(manifest.cdk_app_version), "manifest.cdk_app_version", checks, errors, "must include final CDK app version");
  check(Array.isArray(manifest.cloudformation_stacks) && manifest.cloudformation_stacks.length > 0, "manifest.cloudformation_stacks", checks, errors, "must include deployed stacks");
  for (const stack of manifest.cloudformation_stacks || []) {
    const stackArn = parseCloudFormationStackArn(stack.stack_id);
    check(isFinalText(stack.stack_name), `manifest.cloudformation_stacks.${stack.stack_name || "unknown"}.stack_name`, checks, errors, "must include stack name");
    check(/^arn:aws:cloudformation:ap-northeast-1:[0-9]{12}:stack\//.test(stack.stack_id || ""), `manifest.cloudformation_stacks.${stack.stack_name || "unknown"}.stack_id`, checks, errors, "must include CloudFormation stack ARN");
    check(stackArn?.region === manifest.aws_region, `manifest.cloudformation_stacks.${stack.stack_name || "unknown"}.stack_region`, checks, errors, "stack ARN region must match manifest.aws_region");
    check(stackArn?.accountId === manifest.aws_account_id, `manifest.cloudformation_stacks.${stack.stack_name || "unknown"}.stack_account`, checks, errors, "stack ARN account must match manifest.aws_account_id");
    check(stackArn?.stackName === stack.stack_name, `manifest.cloudformation_stacks.${stack.stack_name || "unknown"}.stack_name_arn`, checks, errors, "stack_name must match stack ARN name");
  }

  for (const key of ["allure_latest_url", "unit_report_url", "integration_report_url", "e2e_report_url"]) {
    check(isArtifactUrl(manifest.test_reports?.[key]), `manifest.test_reports.${key}`, checks, errors, "must be a final http(s) or s3 URL");
  }
  for (const key of ["latest_url", "version_url"]) {
    check(isArtifactUrl(manifest.docs_site?.[key]), `manifest.docs_site.${key}`, checks, errors, "must be a final http(s) or s3 URL");
  }
  check(isFinalText(manifest.rag_evaluation?.evaluation_run_id), "manifest.rag_evaluation.evaluation_run_id", checks, errors, "must include final evaluation run id");
  check(isArtifactUrl(manifest.rag_evaluation?.report_url), "manifest.rag_evaluation.report_url", checks, errors, "must be a final report URL");
  check(manifest.db_migration?.tool === "Flyway", "manifest.db_migration.tool", checks, errors, "must be Flyway");
  check(isFinalText(manifest.db_migration?.latest_version), "manifest.db_migration.latest_version", checks, errors, "must include final DB migration version");
  check(manifest.db_migration?.checksum_status === "matched", "manifest.db_migration.checksum_status", checks, errors, "must be matched");
  check(isAcceptedMonthlyUsd(manifest.cost_estimate?.monthly_usd), "manifest.cost_estimate.monthly_usd", checks, errors, "must be a finite number between 0 and 550");
  check(isFinalText(manifest.cost_estimate?.assumption), "manifest.cost_estimate.assumption", checks, errors, "must include final cost assumption");
  return manifest;
}

function validateChecklist(path, checks, errors, options = {}) {
  const rows = parseCsv(readText(path));
  const currentDate = options.currentDate || todayIsoDate();
  checkSourceColumns(rows.headers, checks, errors);
  check(rows.length === acceptanceIds.length, "checklist.row_count", checks, errors, `must contain ${acceptanceIds.length} rows`);
  for (const id of acceptanceIds) {
    const row = rows.find((item) => item.ID === id);
    check(Boolean(row), `checklist.${id}`, checks, errors, "must exist");
    if (!row) continue;
    const source = acceptanceItemById[id];
    check(row["領域"] === source.area, `checklist.${id}.領域`, checks, errors, "must match source checklist area");
    check(row["重要度"] === source.priority, `checklist.${id}.重要度`, checks, errors, "must match source checklist priority");
    check(row["検収項目"] === source.item, `checklist.${id}.検収項目`, checks, errors, "must match source checklist item");
    check(row["受け入れ条件 / 完了条件"] === source.acceptance_condition, `checklist.${id}.受け入れ条件`, checks, errors, "must match source checklist condition");
    for (const key of [finalResultColumn, finalEvidenceColumn, finalReviewerColumn, finalCheckedDateColumn]) {
      check(isFinalText(sourceChecklistValue(row, key)), `checklist.${id}.${key}`, checks, errors, "must be populated");
    }
    check(sourceChecklistValue(row, finalResultColumn) === "PASS", `checklist.${id}.${finalResultColumn}`, checks, errors, "must be PASS for final acceptance");
    check(isArtifactUrl(sourceChecklistValue(row, finalEvidenceColumn)), `checklist.${id}.${finalEvidenceColumn}_url`, checks, errors, "must be a final http(s) or s3 evidence URL");
    check(isFinalReviewer(sourceChecklistValue(row, finalReviewerColumn)), `checklist.${id}.${finalReviewerColumn}_reviewer`, checks, errors, "must name a final reviewer");
    check(isIsoDate(sourceChecklistValue(row, finalCheckedDateColumn)), `checklist.${id}.${finalCheckedDateColumn}_date`, checks, errors, "must be a YYYY-MM-DD calendar date");
    check(isIsoDateOnOrBefore(sourceChecklistValue(row, finalCheckedDateColumn), currentDate), `checklist.${id}.${finalCheckedDateColumn}_not_future`, checks, errors, "must not be a future date");
    check(!/PENDING|PASS_LOCAL|requires_aws/i.test(Object.values(row).join(" ")), `checklist.${id}.no_draft_status`, checks, errors, "must not contain draft status markers");
  }
}

function checkSourceColumns(headers, checks, errors) {
  try {
    assertSourceChecklistColumns(headers, (condition, message) => {
      if (!condition) throw new Error(message);
    });
    checks.push({ label: "checklist.source_columns", result: "pass", message: "must include source checklist columns" });
  } catch (error) {
    checks.push({ label: "checklist.source_columns", result: "fail", message: "must include source checklist columns" });
    errors.push(`checklist.source_columns: ${error.message}`);
  }
}

function validateCloudFormationInventory(path, checks, errors) {
  const inventory = readJson(path);
  check(inventory.schema_version === "saphnexa-cloudformation-inventory.v1", "cloudformation.schema_version", checks, errors, "must match schema");
  check(inventory.source === "aws-cloudformation-inventory", "cloudformation.source", checks, errors, "must come from AWS CloudFormation inventory");
  check(inventory.final_acceptance_eligible === true, "cloudformation.final_acceptance_eligible", checks, errors, "must be final acceptance eligible");
  check(inventory.aws_capture_required === false, "cloudformation.aws_capture_required", checks, errors, "must not require more AWS capture");
  check(/^arn:aws:cloudformation:ap-northeast-1:[0-9]{12}:stack\//.test(inventory.stack_id || ""), "cloudformation.stack_id", checks, errors, "must include stack ARN");
  check(Array.isArray(inventory.stack_resources) && inventory.stack_resources.length > 0, "cloudformation.stack_resources", checks, errors, "must include resources");
  const resourceTypes = new Set((inventory.stack_resources || []).map((resource) => resource.ResourceType).filter(Boolean));
  for (const resourceType of expectedMajorResourceTypes) {
    check(resourceTypes.has(resourceType), `cloudformation.major_resource_type.${resourceType}`, checks, errors, "must include expected major resource type");
  }
  return inventory;
}

function validateManifestCloudFormationConsistency(manifest, inventory, checks, errors) {
  const manifestStacks = Array.isArray(manifest.cloudformation_stacks) ? manifest.cloudformation_stacks : [];
  const inventoryStackArn = parseCloudFormationStackArn(inventory.stack_id);
  const manifestStack = manifestStacks.find((stack) => stack.stack_id === inventory.stack_id);

  check(manifest.system === inventory.system, "final_evidence.system_consistency", checks, errors, "manifest and CloudFormation inventory must use the same system");
  check(manifest.environment === inventory.environment, "final_evidence.environment_consistency", checks, errors, "manifest and CloudFormation inventory must use the same environment");
  check(manifest.aws_region === inventory.aws_region, "final_evidence.aws_region_consistency", checks, errors, "manifest and CloudFormation inventory must use the same AWS region");
  check(inventoryStackArn?.accountId === manifest.aws_account_id, "final_evidence.aws_account_consistency", checks, errors, "CloudFormation inventory stack ARN account must match manifest.aws_account_id");
  check(inventoryStackArn?.region === manifest.aws_region, "final_evidence.stack_region_consistency", checks, errors, "CloudFormation inventory stack ARN region must match manifest.aws_region");
  check(Boolean(manifestStack), "final_evidence.stack_id_consistency", checks, errors, "CloudFormation inventory stack_id must be listed in manifest.cloudformation_stacks");
  check(manifestStack?.stack_name === inventory.stack_name, "final_evidence.stack_name_consistency", checks, errors, "CloudFormation inventory stack_name must match the manifest stack name for the same stack_id");
}

function requireField(object, key, label, errors) {
  if (!Object.prototype.hasOwnProperty.call(object, key)) errors.push(`${label}: required`);
}

function check(condition, label, checks, errors, message) {
  checks.push({ label, result: condition ? "pass" : "fail", message });
  if (!condition) errors.push(`${label}: ${message}`);
}

function exists(path) {
  try {
    readText(path);
    return true;
  } catch {
    return false;
  }
}

function isFinalText(value) {
  return typeof value === "string" && value.length > 0 && !/pending|example|draft|placeholder|not-for-acceptance/i.test(value);
}

function isUrl(value) {
  return typeof value === "string" && /^https:\/\/github\.com\//.test(value) && !/example|pending|placeholder/i.test(value);
}

function isReleaseUrlForTag(value, gitTag) {
  return parseGitHubReleaseUrl(value)?.tag === gitTag && isFinalText(gitTag);
}

function isArtifactUrl(value) {
  return typeof value === "string" && /^(https:\/\/|s3:\/\/)/.test(value) && !/example|pending|placeholder|dist\//i.test(value);
}

function isAcceptedMonthlyUsd(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 550;
}

function isFinalReviewer(value) {
  return isFinalText(value?.trim?.()) && !/\s{2,}/.test(value);
}

function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isIsoDateOnOrBefore(value, currentDate) {
  return isIsoDate(value) && isIsoDate(currentDate) && value <= currentDate;
}

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseGitHubReleaseUrl(value) {
  if (!isUrl(value)) return null;
  try {
    const url = new URL(value);
    const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/releases\/tag\/(.+)$/);
    if (url.hostname !== "github.com" || !match) return null;
    return {
      repository: `${match[1]}/${match[2]}`,
      tag: decodeURIComponent(match[3])
    };
  } catch {
    return null;
  }
}

function parseCloudFormationStackArn(value) {
  const match = /^arn:aws:cloudformation:([^:]+):([0-9]{12}):stack\/([^/]+)\/.+$/.exec(value || "");
  if (!match) return null;
  return { region: match[1], accountId: match[2], stackName: match[3] };
}

function parseCsv(body) {
  const lines = body.trim().split(/\r?\n/);
  const headers = splitCsvLine(lines[0]).map((header) => header.replace(/^\uFEFF/, ""));
  const rows = lines.slice(1).map((line) => Object.fromEntries(splitCsvLine(line).map((value, index) => [headers[index], value])));
  rows.headers = headers;
  return rows;
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}
