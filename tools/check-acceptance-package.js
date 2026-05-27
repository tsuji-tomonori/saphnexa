import { existsSync } from "node:fs";
import { acceptanceIds } from "./acceptance-ids.js";
import { assert, readJson, readText } from "./lib.js";

const manifest = readJson("dist/acceptance/evidence_manifest.draft.json");
const summary = readJson("dist/acceptance/summary.json");
const defects = readJson("dist/acceptance/defect_list.json");
const checklist = readText("dist/acceptance/acceptance_checklist.draft.csv");

for (const path of [
  "dist/acceptance/evidence_manifest.draft.json",
  "dist/acceptance/acceptance_checklist.draft.csv",
  "dist/acceptance/cloudformation_inventory.draft.json",
  "dist/acceptance/final_readiness.json",
  "dist/acceptance/defect_list.json",
  "dist/acceptance/summary.json"
]) {
  assert(existsSync(path), `acceptance package file missing: ${path}`);
}

for (const key of ["system", "environment", "aws_region", "aws_account_id", "git_commit_sha", "git_tag", "cloudformation_stacks", "db_migration", "test_reports", "docs_site", "rag_evaluation", "cost_estimate"]) {
  assert(Object.prototype.hasOwnProperty.call(manifest, key), `manifest missing ${key}`);
}
assert(manifest.system === "Saphnexa", "manifest system mismatch");
assert(manifest.aws_region === "ap-northeast-1", "manifest region mismatch");
assert(/^[a-f0-9]{40}$/.test(manifest.git_commit_sha), "manifest git commit must be 40 hex chars");
assert(manifest.draft_status === "draft_not_for_final_acceptance", "manifest must be marked as draft");
assert(manifest.pending_final_evidence.length >= 5, "manifest pending final evidence must be explicit");
assert(manifest.aws_account_id === "pending-aws-account-id", "draft manifest must not pretend to know AWS account id");
assert(manifest.git_tag === "pending-release-tag", "draft manifest must not pretend release tag is created");
assert(manifest.cloudformation_inventory.draft_path === "dist/acceptance/cloudformation_inventory.draft.json", "manifest CloudFormation inventory path mismatch");
assert(manifest.cloudformation_inventory.final_acceptance_eligible === false, "manifest CloudFormation inventory must be draft-only");
assert(manifest.cloudformation_inventory.aws_capture_required === true, "manifest CloudFormation inventory must require AWS capture");
assert(manifest.final_readiness.path === "dist/acceptance/final_readiness.json", "manifest final readiness path mismatch");
assert(manifest.final_readiness.final_acceptance_ready === false, "manifest final readiness must remain false");
assert(manifest.final_readiness.blocking_acceptance_ids.length > 0, "manifest final readiness blockers must be explicit");
assert(manifest.final_readiness.release_gate_ready === false, "manifest release gate must remain pending");
assert(manifest.final_readiness.aws_gate_ready === false, "manifest AWS gate must remain pending");
assert(manifest.final_readiness.checklist_gate_ready === false, "manifest checklist gate must remain pending");

const rows = parseCsv(checklist);
assert(rows.length === acceptanceIds.length, `checklist row count mismatch: ${rows.length}`);
for (const id of acceptanceIds) {
  assert(rows.some((row) => row.ID === id), `checklist missing ${id}`);
}
for (const row of rows) {
  for (const key of ["ID", "state", "result", "evidence_link", "reviewer", "checked_date", "note"]) {
    assert(String(row[key] || "").length > 0, `checklist ${row.ID} has empty ${key}`);
  }
  if (row.state === "requires_aws") {
    assert(row.result === "PENDING_AWS", `${row.ID} requires_aws must remain PENDING_AWS`);
  }
  if (row.result === "PASS_LOCAL") {
    assert(row.state === "local_verified", `${row.ID} PASS_LOCAL must map to local_verified`);
  }
}

assert(defects.blocker_critical_open_count === 0, "blocker/critical defects must be 0 in snapshot");
assert(Array.isArray(defects.open_issues), "defect snapshot open_issues must be an array");
assert(summary.checklist_rows === acceptanceIds.length, "summary checklist row count mismatch");
assert(summary.cloudformation_inventory_draft_path === "dist/acceptance/cloudformation_inventory.draft.json", "summary CloudFormation inventory path mismatch");
assert(summary.final_readiness_path === "dist/acceptance/final_readiness.json", "summary final readiness path mismatch");
assert(summary.final_readiness_ready === false, "summary final readiness must remain false");
assert(summary.trace_state_counts.requires_aws > 0, "draft package must preserve remaining AWS blockers");
assert(summary.final_acceptance_ready === false, "draft package must not claim final acceptance readiness");

console.log("acceptance package check passed");

function parseCsv(body) {
  const lines = body.trim().split(/\r?\n/);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => Object.fromEntries(splitCsvLine(line).map((value, index) => [headers[index], value])));
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
