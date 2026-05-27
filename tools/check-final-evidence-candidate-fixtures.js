import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { acceptanceIds, acceptanceItemById } from "./acceptance-ids.js";
import { sourceChecklistColumns } from "./acceptance-checklist-format.js";
import { buildFinalEvidenceCandidateStatus } from "./final-evidence-candidate.js";
import { currentGitCommit } from "./git-context.js";
import { assert } from "./lib.js";

const root = mkdtempSync(join(tmpdir(), "saphnexa-final-candidate-"));

try {
  const resolveGitTagCommit = fixtureGitTagResolver();
  const resolveGitRepository = () => "tsuji-tomonori/saphnexa";
  const readyPaths = writeCandidateFiles(join(root, "ready"), buildReadyCandidate());
  const readyStatus = buildFinalEvidenceCandidateStatus(join(root, "ready-status.json"), { candidatePaths: readyPaths, resolveGitTagCommit, resolveGitRepository });
  assert(readyStatus.ready === true, "ready fixture must be ready");
  assert(readyStatus.status === "ready", "ready fixture status must be ready");
  assert(readyStatus.errors.length === 0, "ready fixture must not have errors");
  assert(readyStatus.checks.some((check) => check.label === "checklist.source_columns" && check.result === "pass"), "ready fixture must check source checklist columns");

  const invalid = buildReadyCandidate();
  invalid.manifest.git_commit_sha = "0123456789abcdef0123456789abcdef01234567";
  invalid.manifest.git_tag = "pending-release-tag";
  invalid.checklistRows[0].結果 = "PENDING_AWS";
  invalid.inventory.source = "local-cdk-intent";
  const invalidPaths = writeCandidateFiles(join(root, "invalid"), invalid);
  const invalidStatus = buildFinalEvidenceCandidateStatus(join(root, "invalid-status.json"), { candidatePaths: invalidPaths, resolveGitTagCommit, resolveGitRepository });
  assert(invalidStatus.ready === false, "invalid fixture must not be ready");
  assert(invalidStatus.status === "invalid", "invalid fixture status must be invalid");
  assert(invalidStatus.errors.some((error) => error.includes("manifest.git_commit_sha_current_ref")), "invalid fixture must reject git commit mismatch");
  assert(invalidStatus.errors.some((error) => error.includes("manifest.git_tag")), "invalid fixture must reject pending git tag");
  assert(invalidStatus.errors.some((error) => error.includes("manifest.git_tag_ref")), "invalid fixture must reject missing git tag ref");
  assert(invalidStatus.errors.some((error) => error.includes(`checklist.${acceptanceIds[0]}.結果`)), "invalid fixture must reject non-PASS checklist result");
  assert(invalidStatus.errors.some((error) => error.includes("cloudformation.source")), "invalid fixture must reject non-AWS CloudFormation source");

  const mismatchedRelease = buildReadyCandidate();
  mismatchedRelease.manifest.github_release_url = "https://github.com/tsuji-tomonori/saphnexa/releases/tag/v0.16.0-acceptance.2";
  const mismatchedReleasePaths = writeCandidateFiles(join(root, "mismatched-release"), mismatchedRelease);
  const mismatchedReleaseStatus = buildFinalEvidenceCandidateStatus(join(root, "mismatched-release-status.json"), { candidatePaths: mismatchedReleasePaths, resolveGitTagCommit, resolveGitRepository });
  assert(mismatchedReleaseStatus.ready === false, "mismatched release fixture must not be ready");
  assert(mismatchedReleaseStatus.errors.some((error) => error.includes("manifest.github_release_url_git_tag")), "mismatched release fixture must reject release URL tag mismatch");

  const wrongReleaseRepository = buildReadyCandidate();
  wrongReleaseRepository.manifest.github_release_url = "https://github.com/example/saphnexa/releases/tag/v0.16.0-acceptance.1";
  const wrongReleaseRepositoryPaths = writeCandidateFiles(join(root, "wrong-release-repository"), wrongReleaseRepository);
  const wrongReleaseRepositoryStatus = buildFinalEvidenceCandidateStatus(join(root, "wrong-release-repository-status.json"), {
    candidatePaths: wrongReleaseRepositoryPaths,
    resolveGitTagCommit,
    resolveGitRepository
  });
  assert(wrongReleaseRepositoryStatus.ready === false, "wrong release repository fixture must not be ready");
  assert(wrongReleaseRepositoryStatus.errors.some((error) => error.includes("manifest.github_release_url_repository")), "wrong release repository fixture must reject release repository mismatch");

  const wrongTagCommit = buildReadyCandidate();
  const wrongTagCommitPaths = writeCandidateFiles(join(root, "wrong-tag-commit"), wrongTagCommit);
  const wrongTagCommitStatus = buildFinalEvidenceCandidateStatus(join(root, "wrong-tag-commit-status.json"), {
    candidatePaths: wrongTagCommitPaths,
    resolveGitTagCommit: () => "0123456789abcdef0123456789abcdef01234567",
    resolveGitRepository
  });
  assert(wrongTagCommitStatus.ready === false, "wrong tag commit fixture must not be ready");
  assert(wrongTagCommitStatus.errors.some((error) => error.includes("manifest.git_tag_commit")), "wrong tag commit fixture must reject tag commit mismatch");

  const mismatchedInventory = buildReadyCandidate();
  mismatchedInventory.inventory.stack_id = "arn:aws:cloudformation:ap-northeast-1:999999999999:stack/saphnexa-other-app/abc12345";
  mismatchedInventory.inventory.stack_name = "saphnexa-other-app";
  const mismatchedInventoryPaths = writeCandidateFiles(join(root, "mismatched-inventory"), mismatchedInventory);
  const mismatchedInventoryStatus = buildFinalEvidenceCandidateStatus(join(root, "mismatched-inventory-status.json"), {
    candidatePaths: mismatchedInventoryPaths,
    resolveGitTagCommit,
    resolveGitRepository
  });
  assert(mismatchedInventoryStatus.ready === false, "mismatched inventory fixture must not be ready");
  assert(mismatchedInventoryStatus.errors.some((error) => error.includes("final_evidence.aws_account_consistency")), "mismatched inventory fixture must reject AWS account mismatch");
  assert(mismatchedInventoryStatus.errors.some((error) => error.includes("final_evidence.stack_id_consistency")), "mismatched inventory fixture must reject stack id mismatch");
  assert(mismatchedInventoryStatus.errors.some((error) => error.includes("final_evidence.stack_name_consistency")), "mismatched inventory fixture must reject stack name mismatch");

  const invalidChecklistValues = buildReadyCandidate();
  invalidChecklistValues.checklistRows[0].証跡リンク = "manual evidence attached";
  invalidChecklistValues.checklistRows[1].確認者 = "pending-final-acceptance";
  invalidChecklistValues.checklistRows[2].確認日 = "2026-02-30";
  const invalidChecklistValuesPaths = writeCandidateFiles(join(root, "invalid-checklist-values"), invalidChecklistValues);
  const invalidChecklistValuesStatus = buildFinalEvidenceCandidateStatus(join(root, "invalid-checklist-values-status.json"), {
    candidatePaths: invalidChecklistValuesPaths,
    resolveGitTagCommit,
    resolveGitRepository
  });
  assert(invalidChecklistValuesStatus.ready === false, "invalid checklist values fixture must not be ready");
  assert(invalidChecklistValuesStatus.errors.some((error) => error.includes(`checklist.${acceptanceIds[0]}.証跡リンク_url`)), "invalid checklist values fixture must reject non-URL evidence link");
  assert(invalidChecklistValuesStatus.errors.some((error) => error.includes(`checklist.${acceptanceIds[1]}.確認者`)), "invalid checklist values fixture must reject pending reviewer");
  assert(invalidChecklistValuesStatus.errors.some((error) => error.includes(`checklist.${acceptanceIds[2]}.確認日_date`)), "invalid checklist values fixture must reject invalid checked date");

  console.log("final evidence candidate fixture check passed");
} finally {
  rmSync(root, { recursive: true, force: true });
}

function fixtureGitTagResolver() {
  const gitCommit = currentGitCommit();
  return (tagName) => {
    if (tagName === "v0.16.0-acceptance.1") return gitCommit;
    return null;
  };
}

function buildReadyCandidate() {
  const accountId = ["1234", "5678", "9012"].join("");
  const stackId = `arn:aws:cloudformation:ap-northeast-1:${accountId}:stack/saphnexa-uat-app/abc12345`;
  return {
    manifest: {
      system: "Saphnexa",
      environment: "uat",
      aws_region: "ap-northeast-1",
      aws_account_id: accountId,
      git_commit_sha: currentGitCommit(),
      git_tag: "v0.16.0-acceptance.1",
      github_release_url: "https://github.com/tsuji-tomonori/saphnexa/releases/tag/v0.16.0-acceptance.1",
      cdk_app_version: "0.1.0",
      cloudformation_stacks: [
        {
          stack_name: "saphnexa-uat-app",
          stack_id: stackId
        }
      ],
      db_migration: {
        tool: "Flyway",
        latest_version: "V001__initial_saphnexa_schema.sql",
        checksum_status: "matched"
      },
      test_reports: {
        allure_latest_url: "https://github.com/tsuji-tomonori/saphnexa/actions/runs/26494798563",
        unit_report_url: "https://github.com/tsuji-tomonori/saphnexa/actions/runs/26494798563",
        integration_report_url: "https://github.com/tsuji-tomonori/saphnexa/actions/runs/26494798563",
        e2e_report_url: "https://github.com/tsuji-tomonori/saphnexa/actions/runs/26494798563"
      },
      docs_site: {
        latest_url: "s3://saphnexa-acceptance-artifacts/docs/latest/",
        version_url: "s3://saphnexa-acceptance-artifacts/docs/v0.16.0-acceptance.1/"
      },
      rag_evaluation: {
        evaluation_run_id: "eval-20260527-uat-final",
        report_url: "s3://saphnexa-acceptance-artifacts/rag/eval-20260527-uat-final.json"
      },
      cost_estimate: {
        monthly_usd: 420,
        assumption: "UAT estimate for 50 DAU and 10 questions/user/day."
      }
    },
    checklistRows: acceptanceIds.map((id) => {
      const source = acceptanceItemById[id];
      return {
        ID: id,
        領域: source.area,
        検収項目: source.item,
        "受け入れ条件 / 完了条件": source.acceptance_condition,
        定量基準: source.quantitative_criteria,
        監査証跡: source.evidence,
        確認方法: source.verification_method,
        重要度: source.priority,
        結果: "PASS",
        証跡リンク: "https://github.com/tsuji-tomonori/saphnexa/actions/runs/26494798563",
        確認者: "acceptance-reviewer",
        確認日: "2026-05-27",
        備考: "fixture-final-validator-coverage"
      };
    }),
    inventory: {
      schema_version: "saphnexa-cloudformation-inventory.v1",
      system: "Saphnexa",
      environment: "uat",
      aws_region: "ap-northeast-1",
      stack_name: "saphnexa-uat-app",
      stack_id: stackId,
      source: "aws-cloudformation-inventory",
      final_acceptance_eligible: true,
      aws_capture_required: false,
      stack_resources: [
        {
          LogicalResourceId: "ApiService",
          PhysicalResourceId: "saphnexa-uat-api",
          ResourceType: "AWS::Lambda::Function"
        }
      ]
    }
  };
}

function writeCandidateFiles(dir, candidate) {
  mkdirSync(dir, { recursive: true });
  const paths = {
    evidence_manifest: join(dir, "evidence_manifest.json"),
    acceptance_checklist: join(dir, "acceptance_checklist.csv"),
    cloudformation_inventory: join(dir, "cloudformation_inventory.uat.json")
  };
  writeFileSync(paths.evidence_manifest, `${JSON.stringify(candidate.manifest, null, 2)}\n`);
  writeFileSync(paths.acceptance_checklist, renderCsv(candidate.checklistRows));
  writeFileSync(paths.cloudformation_inventory, `${JSON.stringify(candidate.inventory, null, 2)}\n`);
  return paths;
}

function renderCsv(rows) {
  return `${sourceChecklistColumns.join(",")}\n${rows.map((row) => sourceChecklistColumns.map((key) => csv(row[key])).join(",")).join("\n")}\n`;
}

function csv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}
