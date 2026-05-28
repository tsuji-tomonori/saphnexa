import { assert, listFiles, readText } from "./lib.js";

const requiredRunbooks = [
  "docs/ops/runbooks/incident-response.md",
  "docs/ops/runbooks/reingestion.md",
  "docs/ops/runbooks/evaluation-rerun.md",
  "docs/ops/runbooks/rollback.md",
  "docs/ops/runbooks/user-import-failure.md",
  "docs/ops/runbooks/access-change.md",
  "docs/ops/runbooks/backup-restore.md",
  "docs/ops/runbooks/cloudformation-inventory.md",
  "docs/ops/runbooks/final-acceptance.md",
  "docs/ops/runbooks/aws-dev-uat-validation.md"
];

for (const file of requiredRunbooks) {
  const body = readText(file);
  for (const heading of ["## 目的", "## 前提", "## 手順", "## 検証", "## 証跡"]) {
    assert(body.includes(heading), `${file} missing ${heading}`);
  }
}

const finalAcceptanceRunbook = readText("docs/ops/runbooks/final-acceptance.md");
assert(
  finalAcceptanceRunbook.indexOf("CFN_CAPTURED_AT=<capture-iso-timestamp> npm run cfn:inventory:normalize") <
    finalAcceptanceRunbook.indexOf("npm run acceptance:final-manifest:build"),
  "final acceptance runbook must normalize CloudFormation inventory before final manifest build"
);
assert(
  finalAcceptanceRunbook.indexOf("npm run acceptance:final-manifest:build") <
    finalAcceptanceRunbook.indexOf("npm run acceptance:final-candidate:check"),
  "final acceptance runbook must build final manifest before final candidate check"
);

const localVerification = readText("docs/ops/local-verification.md");
const awsDevUatRunbook = readText("docs/ops/runbooks/aws-dev-uat-validation.md");
for (const command of [
  "npm run admin-artifacts:build",
  "npm run artifacts:check",
  "npm run admin-artifacts:publish:check",
  "npm run api:openapi:check",
  "npm run cdk:constructs:check",
  "npm run coverage:check",
  "npm run ui:check",
  "npm run web:flow:check",
  "npm run web:a11y:check",
  "npm run web:perf:local",
  "npm run web:bundle:check",
  "npm run perf:api:local",
  "npm run failure:check",
  "npm run rag:quality:check",
  "npm run rag:security:check",
  "npm run rag:aws-binding:check",
  "npm run rag:perf:local",
  "npm run db:migration:check",
  "npm run db:integrity:check",
  "npm run search:local:check",
  "npm run observability:check",
  "npm run admin:workflow:check",
  "npm run offline-artifacts:check",
  "npm run restore:drill:check",
  "npm run edge:security:check",
  "npm run acceptance:source:check",
  "npm run acceptance:external-actions:build",
  "npm run acceptance:external-actions:check",
  "npm run acceptance:final-checklist:fixture:check",
  "npm run acceptance:final-manifest:fixture:check",
  "npm run acceptance:final-candidate:fixture:check",
  "npm run acceptance:final:fixture:check",
  "npm run acceptance:final-candidate:check",
  "npm run acceptance:final:build",
  "npm run acceptance:final:check",
  "npm run acceptance:package:build",
  "npm run acceptance:package:check",
  "npm run aws:dev-uat:preflight",
  "npm run aws:dev-uat:preflight:build",
  "npm run aws:dev-uat:execution-bridge:check",
  "npm run aws:dev-uat:execution-bridge:probe",
  "npm run aws:dev-uat:raw-capture-plan:build",
  "npm run aws:dev-uat:raw-capture-plan:check",
  "npm run aws:dev-uat:raw-input-scaffold:build",
  "npm run aws:dev-uat:raw-input-scaffold:check",
  "npm run aws:dev-uat:operator-input:build",
  "npm run aws:dev-uat:operator-input:check",
  "npm run aws:dev-uat:operator-input:fixture:check",
  "npm run aws:dev-uat:operator-runbook:build",
  "npm run aws:dev-uat:operator-runbook:check",
  "npm run aws:dev-uat:operator-runbook:fixture:check",
  "npm run aws:dev-uat:raw-output:check",
  "npm run aws:dev-uat:raw-output:fixture:check",
  "npm run aws:dev-uat:raw-input:check",
  "npm run aws:dev-uat:raw-input:fixture:check",
  "npm run aws:dev-uat:evidence-bundle:check",
  "npm run aws:dev-uat:evidence-bundle:fixture:check",
  "npm run aws:dev-uat:preflight-raw-input:build",
  "npm run aws:dev-uat:preflight-raw-input:fixture:check",
  "npm run aws:dev-uat:validation-capture:fixture:check",
  "npm run aws:dev-uat:validation-raw-input:build",
  "npm run aws:dev-uat:validation-raw-input:fixture:check",
  "npm run aws:dev-uat:materialized-flow:fixture:check",
  "npm run aws:dev-uat:final-readiness:check",
  "npm run aws:dev-uat:final-readiness:fixture:check",
  "npm run aws:dev-uat:operator-handoff:check",
  "npm run aws:dev-uat:operator-handoff:fixture:check",
  "npm run aws:dev-uat:capture-helpers:check",
  "npm run aws:dev-uat:validation:build",
  "npm run aws:dev-uat:validation:check",
  "npm run aws:dev-uat:validation:fixture:check",
  "npm run aws:dev-uat:evidence:fixture:check",
  "npm run cfn:inventory:build",
  "npm run cfn:inventory:check",
  "npm run edge:identity:realtime:check",
  "npm run cfn:inventory:normalize:fixture:check"
]) {
  assert(localVerification.includes(command), `local verification docs missing ${command}`);
}
for (const phrase of [
  "preflight `materialize_command`",
  "validation `materialize_command`",
  "raw output/input check command",
  "materialization.command",
  "materialized flow fixture",
  "final readiness manifest",
  "operator handoff",
  "evidence input map",
  "final readiness bundle gate summary",
  "final_readiness_summary.evidence_bundle",
  "required_inputs.evidence",
  "operator input",
  "resolved operator input",
  "operator execution runbook",
  "requires_resolved_operator_input",
  "ready operator execution runbook",
  "current git commit",
  "artifact coverage",
  "current readiness artifact path match",
  "current artifact digest/size match",
  "all bundle artifact metadata match",
  "all bundle artifact scope match",
  "mismatched evidence bundle artifact path",
  "mismatched evidence bundle artifact digest",
  "mismatched raw-output artifact digest",
  "out-of-scope bundle artifact",
  "invalid_evidence_bundle_manifest",
  "stale_evidence_bundle_manifest",
  "stale_operator_input",
  "stale_operator_runbook",
  "missing_operator_runbook",
  "invalid_operator_runbook",
  "missing_operator_input",
  "invalid_operator_input",
  "missing raw input",
  "capture plan / scaffold / materialize / raw output-input check",
  "final evidence build / final gate",
  "scaffold/build/check"
]) {
  assert(awsDevUatRunbook.includes(phrase) || localVerification.includes(phrase), `docs missing AWS dev/UAT materializer plan phrase: ${phrase}`);
}
for (const phrase of [
  "defect-snapshot-refresh",
  "gh issue list --state open --json number,title,labels,state",
  "ローカル snapshot だけでは完了扱いにしない",
  "AC-153 の最終 PASS 判定",
  "CloudFormation capture、defect snapshot refresh、final evidence 作成"
]) {
  assert(localVerification.includes(phrase), `local verification docs missing ${phrase}`);
}

for (const file of listFiles(["docs"], (path) => path.endsWith(".md"))) {
  const body = readText(file);
  assert(!/[ \t]$/m.test(body), `${file} has trailing whitespace`);
}

console.log("docs check passed");
