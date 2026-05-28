import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { currentJstTimestamp, readText } from "./lib.js";

export const externalActionPlanPath = "dist/acceptance/external_action_plan.json";

const requiredActionIds = [
  "release-tag",
  "github-release",
  "aws-deploy-publish",
  "aws-dev-uat-validation",
  "cloudformation-capture",
  "defect-snapshot-refresh",
  "final-evidence-candidate",
  "final-checklist-signoff"
];

export function buildExternalAcceptanceActionPlan(outputPath = externalActionPlanPath) {
  const blockers = parseTraceRows(readText("docs/acceptance/traceability.md"))
    .filter((row) => row.state !== "local_verified")
    .map((row) => row.id);

  const actions = [
    action({
      id: "release-tag",
      title: "Git tag を作成し immutable release 対象を固定する",
      acceptance_ids: ["AC-001", "AC-150", "AC-151", "AC-152"],
      candidate_commands: [
        "git tag -a <release-tag> <commit-sha> -m \"Saphnexa acceptance release <release-tag>\"",
        "git push origin <release-tag>"
      ],
      required_before_run: ["検収対象 commit SHA の確定", "tag 名の承認"],
      evidence_outputs: ["Git tag URL or tag name", "commit SHA"]
    }),
    action({
      id: "github-release",
      title: "GitHub release を作成し evidence manifest と成果物を紐づける",
      acceptance_ids: ["AC-001", "AC-002", "AC-150", "AC-151", "AC-152"],
      candidate_commands: [
        "gh release create <release-tag> --target <commit-sha> --title \"Saphnexa <release-tag>\" --notes-file <release-notes.md>"
      ],
      required_before_run: ["Git tag 作成済み", "release notes 承認", "添付する evidence artifact の確定"],
      evidence_outputs: ["GitHub release URL"]
    }),
    action({
      id: "aws-deploy-publish",
      title: "AWS UAT へ deploy し docs/Allure/admin artifacts を publish する",
      acceptance_ids: ["AC-002", "AC-081", "AC-150", "AC-151", "AC-152"],
      candidate_commands: [
        "cdk deploy --context env=uat",
        "aws s3 sync dist/admin/docs/latest/ s3://<admin-artifacts-bucket>/docs-site/latest/",
        "aws s3 sync dist/admin/docs/versions/v0.16/ s3://<admin-artifacts-bucket>/docs-site/releases/v0.16/",
        "aws s3 sync dist/admin/docs/versions/v0.17/ s3://<admin-artifacts-bucket>/docs-site/releases/v0.17/",
        "aws s3 sync dist/admin/test-reports/allure/latest/ s3://<admin-artifacts-bucket>/test-reports/allure/latest/",
        "aws s3 sync dist/admin/test-reports/allure/runs/<test_run_id>/ s3://<admin-artifacts-bucket>/test-reports/allure/runs/<test_run_id>/"
      ],
      required_before_run: ["AWS account/role 確認", "UAT deploy window 承認", "rollback 手順確認"],
      evidence_outputs: ["AWS account id", "CloudFormation stack id", "published docs URL", "published Allure URL"]
    }),
    action({
      id: "cloudformation-capture",
      title: "CloudFormation describe-stacks/list-stack-resources を取得して inventory を正規化する",
      acceptance_ids: ["AC-002", "AC-081", "AC-150", "AC-151", "AC-152"],
      candidate_commands: [
        "aws cloudformation describe-stacks --stack-name saphnexa-uat-app --region ap-northeast-1 --output json",
        "aws cloudformation list-stack-resources --stack-name saphnexa-uat-app --region ap-northeast-1 --output json",
        "CFN_CAPTURED_AT=<capture-iso-timestamp> npm run cfn:inventory:normalize"
      ],
      required_before_run: ["AWS deploy 完了", "CloudFormation stack name 確定"],
      evidence_outputs: ["docs/acceptance/cloudformation/cloudformation_inventory.uat.json"]
    }),
    action({
      id: "aws-dev-uat-validation",
      title: "AWS dev/UAT で E2E・性能・RAG品質検証を実行し結果証跡を検査する",
      acceptance_ids: ["AC-098", "AC-123", "AC-130", "AC-131", "AC-132", "AC-133", "AC-150", "AC-151", "AC-152"],
      candidate_commands: [
        "npm run aws:dev-uat:execution-bridge:probe",
        "npm run aws:dev-uat:raw-capture-plan:build",
        "npm run aws:dev-uat:raw-capture-plan:check",
        "npm run aws:dev-uat:raw-input-scaffold:build",
        "npm run aws:dev-uat:raw-input-scaffold:check",
        "npm run aws:dev-uat:operator-input:check",
        "npm run aws:dev-uat:operator-input:check -- --input dist/acceptance/aws_dev_uat_operator_input.json --require-resolved",
        "npm run aws:dev-uat:capture-helpers:check",
        "npm run aws:dev-uat:preflight-raw-input:build -- --scaffold dist/acceptance/raw/aws_dev_uat_preflight.raw.scaffold.json --output <raw-preflight-input.json> --captured-at <capture-jst-timestamp> --git-tag <release-tag> --github-release-url <github-release-url>",
        "npm run aws:dev-uat:raw-output:check -- preflight --input <raw-preflight-input.json>",
        "npm run aws:dev-uat:raw-input:check -- preflight --input <raw-preflight-input.json>",
        "npm run aws:dev-uat:preflight:build -- --input <raw-preflight-input.json>",
        "npm run aws:dev-uat:preflight:final",
        "node tools/capture-aws-dev-uat-e2e-result.js --env uat --run-id <run-id> > raw/e2e-allure-run.json",
        "aws s3 ls s3://saphnexa-uat-logs/cloudfront/<run-id>/ --region ap-northeast-1 > raw/cloudfront-access-log-list.txt",
        "node tools/capture-aws-dev-uat-performance-result.js --env uat --run-id <run-id> > raw/performance-report.json",
        "aws cloudwatch get-dashboard --dashboard-name saphnexa-uat --region ap-northeast-1 > raw/cloudwatch-dashboard.json",
        "node tools/capture-aws-dev-uat-rag-quality-result.js --env uat --run-id <run-id> > raw/rag-quality-report.json",
        "aws bedrock get-evaluation-job --job-identifier rag-eval-<run-id> --region ap-northeast-1 > raw/bedrock-evaluation-job.json",
        "npm run aws:dev-uat:validation-raw-input:build -- --scaffold dist/acceptance/raw/aws_dev_uat_validation.raw.scaffold.json --output <raw-validation-input.json> --captured-at <capture-jst-timestamp> --git-tag <release-tag> --github-release-url <github-release-url> --aws-account-id <aws-account-id>",
        "npm run aws:dev-uat:raw-output:check -- validation --input <raw-validation-input.json>",
        "npm run aws:dev-uat:raw-input:check -- validation --input <raw-validation-input.json>",
        "npm run aws:dev-uat:validation:build -- --input <raw-validation-input.json>",
        "npm run test:e2e:aws",
        "npm run perf:aws",
        "npm run rag:quality:aws",
        "npm run aws:dev-uat:validation:final",
        "npm run aws:dev-uat:evidence-bundle:check -- --preflight-raw-input <raw-preflight-input.json> --validation-raw-input <raw-validation-input.json> --preflight-evidence dist/acceptance/aws_dev_uat_preflight.json --validation-evidence dist/acceptance/aws_dev_uat_validation.json --execution-bridge dist/acceptance/aws_dev_uat_execution_bridge.json --output dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json",
        "npm run aws:dev-uat:final-readiness:check -- --probe-aws-identity --require-ready"
      ],
      required_before_run: ["AWS deploy/publish 完了", "テストユーザー/管理者ユーザー準備", "golden dataset 準備", "負荷試験 window 承認", "E2E/性能/RAG品質の外部実行結果取得済み"],
      evidence_outputs: [
        "dist/acceptance/aws_dev_uat_execution_bridge.json",
        "dist/acceptance/aws_dev_uat_raw_capture_plan.json",
        "dist/acceptance/aws_dev_uat_operator_input.scaffold.json",
        "dist/acceptance/aws_dev_uat_operator_input.json",
        "dist/acceptance/raw/aws_dev_uat_preflight.raw.scaffold.json",
        "dist/acceptance/raw/aws_dev_uat_validation.raw.scaffold.json",
        "dist/acceptance/aws_dev_uat_preflight.json",
        "dist/acceptance/aws_dev_uat_validation.json",
        "dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json",
        "dist/acceptance/aws_dev_uat_final_readiness.json",
        "Allure E2E run URL",
        "performance report URL",
        "RAG quality evaluation report URL",
        "CloudWatch/AppSync/CloudFront logs"
      ]
    }),
    action({
      id: "defect-snapshot-refresh",
      title: "GitHub issue tracker を再取得し Blocker/Critical defect 0 件を確認する",
      acceptance_ids: ["AC-153", "AC-150", "AC-151", "AC-152"],
      candidate_commands: [
        "gh issue list --state open --json number,title,labels,state",
        "npm run acceptance:package:check",
        "npm run acceptance:final:check"
      ],
      required_before_run: ["検収対象 repository 確定", "GitHub issue tracker 確認権限", "最終検収時刻"],
      evidence_outputs: ["docs/acceptance/defects/open_issues_snapshot.json", "dist/acceptance/defect_list.json"]
    }),
    action({
      id: "final-evidence-candidate",
      title: "final evidence manifest と final checklist 候補を作成する",
      acceptance_ids: ["AC-001", "AC-002", "AC-004", "AC-081", "AC-150", "AC-151", "AC-152", "AC-153"],
      candidate_commands: [
        "npm run acceptance:final-manifest:build",
        "npm run acceptance:final-checklist:build",
        "npm run acceptance:final-candidate:check",
        "npm run acceptance:final:build",
        "npm run acceptance:final:check"
      ],
      required_before_run: ["GitHub release URL", "AWS deploy/publish URL", "CloudFormation inventory", "fresh defect snapshot", "検収者 reviewer 名"],
      evidence_outputs: [
        "docs/acceptance/final/evidence_manifest.json",
        "docs/acceptance/final/acceptance_checklist.csv",
        "dist/acceptance/final_candidate_status.json"
      ]
    }),
    action({
      id: "final-checklist-signoff",
      title: "最終 checklist を確認・署名し P0/P1/P2 全 PASS を確定する",
      acceptance_ids: ["AC-004", "AC-150", "AC-151", "AC-152", "AC-153"],
      candidate_commands: [
        "npm run acceptance:final-candidate:check",
        "npm run acceptance:package:build",
        "npm run acceptance:package:check"
      ],
      required_before_run: ["final evidence candidate ready", "fresh defect snapshot", "Blocker/Critical defect 0", "検収者確認"],
      evidence_outputs: ["signed acceptance checklist", "final acceptance package"]
    })
  ];

  const plan = {
    schema_version: "saphnexa-external-acceptance-action-plan.v1",
    generated_at: currentJstTimestamp(),
    generated_by: "tools/build-external-acceptance-actions.js",
    ready: false,
    status: "pending_external_actions",
    blocking_acceptance_ids: blockers,
    actions,
    pending_action_ids: actions.filter((item) => item.status === "pending").map((item) => item.id),
    note: "These actions change external state or require acceptance signoff. They require explicit confirmation before execution."
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`);
  return plan;
}

export function requiredExternalActionIds() {
  return requiredActionIds;
}

function action(item) {
  return {
    ...item,
    status: "pending",
    requires_confirmation: true,
    external_state_change: true,
    completed: false
  };
}

function parseTraceRows(body) {
  return [...body.matchAll(/^\| (AC-\d{3}) \| ([a-z_]+) \| (.+) \|$/gm)]
    .map((match) => ({ id: match[1], state: match[2], evidence: match[3] }));
}
