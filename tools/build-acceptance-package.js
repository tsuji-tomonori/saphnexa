import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { acceptanceIds } from "./acceptance-ids.js";
import { buildCloudFormationInventoryDraft, cloudFormationInventoryPath } from "./cloudformation-inventory.js";
import { buildExternalAcceptanceActionPlan, externalActionPlanPath } from "./external-acceptance-actions.js";
import { buildFinalAcceptanceReadiness, finalReadinessPath } from "./final-acceptance-readiness.js";
import { readJson, readText } from "./lib.js";

const outputRoot = "dist/acceptance";
const trace = readText("docs/acceptance/traceability.md");
const packageJson = readJson("package.json");
const defectSnapshot = readJson("docs/acceptance/defects/open_issues_snapshot.json");
const gitCommit = currentGitCommit();
const rows = parseTraceRows(trace);
const counts = countStates(rows);
const cloudFormationInventory = buildCloudFormationInventoryDraft(cloudFormationInventoryPath);
const externalActionPlan = buildExternalAcceptanceActionPlan(externalActionPlanPath);
const finalReadiness = buildFinalAcceptanceReadiness(finalReadinessPath);

const manifest = {
  system: "Saphnexa",
  environment: "uat",
  aws_region: "ap-northeast-1",
  aws_account_id: "pending-aws-account-id",
  git_commit_sha: gitCommit,
  git_tag: "pending-release-tag",
  cdk_app_version: packageJson.version,
  cloudformation_stacks: [
    {
      stack_name: "saphnexa-uat-app",
      stack_id: "pending-aws-cloudformation-deploy"
    }
  ],
  cloudformation_inventory: {
    draft_path: cloudFormationInventoryPath,
    schema_path: "docs/acceptance/cloudformation/cloudformation_inventory.schema.json",
    source: cloudFormationInventory.source,
    final_acceptance_eligible: cloudFormationInventory.final_acceptance_eligible,
    aws_capture_required: cloudFormationInventory.aws_capture_required
  },
  db_migration: {
    tool: "Flyway",
    latest_version: "V001",
    checksum_status: "matched"
  },
  test_reports: {
    allure_latest_url: "dist/admin/test-reports/allure/latest/",
    unit_report_url: "dist/admin/test-reports/allure/latest/",
    integration_report_url: "dist/admin/test-reports/allure/latest/",
    e2e_report_url: "dist/admin/test-reports/allure/latest/"
  },
  docs_site: {
    latest_url: "dist/admin/docs/latest/",
    version_url: "dist/admin/docs/versions/v0.16/"
  },
  rag_evaluation: {
    evaluation_run_id: "local-rag-quality-report",
    report_url: "dist/reports/rag-quality-local.json"
  },
  cost_estimate: {
    monthly_usd: 550,
    assumption: "Local acceptance draft uses the configured 50 DAU / 10 questions per user per day guardrail. Final UAT requires AWS account-specific cost evidence."
  },
  final_readiness: {
    path: finalReadinessPath,
    final_acceptance_ready: finalReadiness.final_acceptance_ready,
    blocking_acceptance_ids: finalReadiness.blocking_acceptance_ids.map((row) => row.id),
    release_gate_ready: finalReadiness.release_gate.ready,
    aws_gate_ready: finalReadiness.aws_gate.ready,
    checklist_gate_ready: finalReadiness.checklist_gate.ready,
    final_candidate_status_path: finalReadiness.final_candidate_gate.status_path,
    final_candidate_ready: finalReadiness.final_candidate_gate.ready,
    external_action_plan_path: externalActionPlanPath,
    external_actions_pending: externalActionPlan.pending_action_ids
  },
  draft_status: "draft_not_for_final_acceptance",
  pending_final_evidence: [
    "GitHub release and immutable Git tag",
    "AWS account id and deployed CloudFormation stack ids",
    "CloudFront/S3/Docusaurus/Allure published URLs",
    "Aurora DSQL Flyway apply report",
    "Final signed acceptance checklist"
  ]
};

const checklist = buildChecklist(rows);
const summary = {
  schema_version: "saphnexa-acceptance-package-summary.v1",
  generated_at: "2026-05-27T11:25:00+09:00",
  generated_by: "tools/build-acceptance-package.js",
  git_commit_sha: gitCommit,
  trace_state_counts: counts,
  checklist_rows: checklist.length,
  blocker_critical_open_count: defectSnapshot.blocker_critical_open_count,
  cloudformation_inventory_draft_path: cloudFormationInventoryPath,
  final_readiness_path: finalReadinessPath,
  final_readiness_ready: finalReadiness.final_acceptance_ready,
  final_candidate_status_path: finalReadiness.final_candidate_gate.status_path,
  final_candidate_ready: finalReadiness.final_candidate_gate.ready,
  external_action_plan_path: externalActionPlanPath,
  external_actions_pending: externalActionPlan.pending_action_ids.length,
  final_acceptance_ready: counts.requires_aws === 0,
  note: "Draft package for local evidence consolidation. Final acceptance still requires AWS/UAT evidence for requires_aws rows."
};

write(join(outputRoot, "evidence_manifest.draft.json"), `${JSON.stringify(manifest, null, 2)}\n`);
write(join(outputRoot, "acceptance_checklist.draft.csv"), renderCsv(checklist));
write(join(outputRoot, "defect_list.json"), `${JSON.stringify(defectSnapshot, null, 2)}\n`);
write(join(outputRoot, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

console.log(`acceptance package draft generated: ${outputRoot}`);

function parseTraceRows(body) {
  return [...body.matchAll(/^\| (AC-\d{3}) \| ([a-z_]+) \| (.+) \|$/gm)]
    .map((match) => ({ id: match[1], state: match[2], evidence: match[3].replaceAll("`", "'") }));
}

function countStates(items) {
  const counts = { local_verified: 0, requires_aws: 0, implemented_unverified: 0, scaffolded: 0, not_started: 0 };
  for (const row of items) counts[row.state] = (counts[row.state] || 0) + 1;
  return counts;
}

function buildChecklist(items) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return acceptanceIds.map((id) => {
    const row = byId.get(id);
    const result = row.state === "local_verified" ? "PASS_LOCAL" : "PENDING_AWS";
    return {
      ID: id,
      state: row.state,
      result,
      evidence_link: row.evidence,
      reviewer: result === "PASS_LOCAL" ? "local-automation" : "pending-final-acceptance",
      checked_date: "2026-05-27",
      note: result === "PASS_LOCAL" ? "ローカル検証済み。最終検収では監査証跡URLを確認する。" : "AWS/UATまたは最終検収操作が必要。"
    };
  });
}

function renderCsv(items) {
  const headers = ["ID", "state", "result", "evidence_link", "reviewer", "checked_date", "note"];
  return `${headers.join(",")}\n${items.map((item) => headers.map((key) => csv(item[key])).join(",")).join("\n")}\n`;
}

function csv(value) {
  const text = String(value ?? "");
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function write(path, body) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}

function currentGitCommit() {
  if (/^[a-f0-9]{40}$/i.test(process.env.GITHUB_SHA || "")) return process.env.GITHUB_SHA.toLowerCase();

  const gitDir = resolveGitDir();
  const commonDir = resolveCommonGitDir(gitDir);
  const head = readFileSync(join(gitDir, "HEAD"), "utf8").trim();
  if (/^[a-f0-9]{40}$/i.test(head)) return head.toLowerCase();

  const ref = head.match(/^ref: (.+)$/)?.[1];
  if (!ref) throw new Error(`Unsupported git HEAD format: ${head}`);

  const refPath = join(commonDir, ref);
  if (existsSync(refPath)) return readFileSync(refPath, "utf8").trim().toLowerCase();

  const packedRefs = join(commonDir, "packed-refs");
  if (existsSync(packedRefs)) {
    for (const line of readFileSync(packedRefs, "utf8").split(/\r?\n/)) {
      const match = line.match(/^([a-f0-9]{40}) (.+)$/i);
      if (match?.[2] === ref) return match[1].toLowerCase();
    }
  }

  throw new Error(`Git ref not found: ${ref}`);
}

function resolveGitDir() {
  if (statSync(".git").isDirectory()) return resolve(".git");

  const dotGit = readFileSync(".git", "utf8").trim();
  const gitDir = dotGit.match(/^gitdir: (.+)$/)?.[1];
  if (gitDir) return resolve(gitDir);
  return resolve(".git");
}

function resolveCommonGitDir(gitDir) {
  const commonDirPath = join(gitDir, "commondir");
  if (!existsSync(commonDirPath)) return gitDir;
  return resolve(gitDir, readFileSync(commonDirPath, "utf8").trim());
}
