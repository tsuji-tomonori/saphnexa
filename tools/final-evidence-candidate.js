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
import { currentGitCommit } from "./git-context.js";
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
    validateManifest(paths.evidence_manifest, checks, errors);
    validateChecklist(paths.acceptance_checklist, checks, errors);
    validateCloudFormationInventory(paths.cloudformation_inventory, checks, errors);
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

function validateManifest(path, checks, errors) {
  const manifest = readJson(path);
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
  check(isUrl(manifest.github_release_url), "manifest.github_release_url", checks, errors, "must be an https GitHub release URL");
  check(isReleaseUrlForTag(manifest.github_release_url, manifest.git_tag), "manifest.github_release_url_git_tag", checks, errors, "must point to the same release tag as manifest.git_tag");
  check(Array.isArray(manifest.cloudformation_stacks) && manifest.cloudformation_stacks.length > 0, "manifest.cloudformation_stacks", checks, errors, "must include deployed stacks");
  for (const stack of manifest.cloudformation_stacks || []) {
    check(isFinalText(stack.stack_name), `manifest.cloudformation_stacks.${stack.stack_name || "unknown"}.stack_name`, checks, errors, "must include stack name");
    check(/^arn:aws:cloudformation:ap-northeast-1:[0-9]{12}:stack\//.test(stack.stack_id || ""), `manifest.cloudformation_stacks.${stack.stack_name || "unknown"}.stack_id`, checks, errors, "must include CloudFormation stack ARN");
  }

  for (const key of ["allure_latest_url", "unit_report_url", "integration_report_url", "e2e_report_url"]) {
    check(isArtifactUrl(manifest.test_reports?.[key]), `manifest.test_reports.${key}`, checks, errors, "must be a final http(s) or s3 URL");
  }
  for (const key of ["latest_url", "version_url"]) {
    check(isArtifactUrl(manifest.docs_site?.[key]), `manifest.docs_site.${key}`, checks, errors, "must be a final http(s) or s3 URL");
  }
  check(isFinalText(manifest.rag_evaluation?.evaluation_run_id), "manifest.rag_evaluation.evaluation_run_id", checks, errors, "must include final evaluation run id");
  check(isArtifactUrl(manifest.rag_evaluation?.report_url), "manifest.rag_evaluation.report_url", checks, errors, "must be a final report URL");
  check(manifest.db_migration?.checksum_status === "matched", "manifest.db_migration.checksum_status", checks, errors, "must be matched");
  check(Number(manifest.cost_estimate?.monthly_usd) <= 550, "manifest.cost_estimate.monthly_usd", checks, errors, "must be <= 550");
}

function validateChecklist(path, checks, errors) {
  const rows = parseCsv(readText(path));
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
  if (!isUrl(value) || !isFinalText(gitTag)) return false;
  try {
    const url = new URL(value);
    const marker = "/releases/tag/";
    const markerIndex = url.pathname.indexOf(marker);
    if (url.hostname !== "github.com" || markerIndex === -1) return false;
    const tagFromUrl = url.pathname.slice(markerIndex + marker.length);
    return decodeURIComponent(tagFromUrl) === gitTag;
  } catch {
    return false;
  }
}

function isArtifactUrl(value) {
  return typeof value === "string" && /^(https:\/\/|s3:\/\/)/.test(value) && !/example|pending|placeholder|dist\//i.test(value);
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
