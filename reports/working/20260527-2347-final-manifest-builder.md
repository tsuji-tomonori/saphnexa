# final evidence manifest builder 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と検収受入条件 package v1.0 に基づき、最終検収の未達項目を満たすための実装・検証を継続する。
- 作業前 task、検証、作業レポート、PR コメント、task 完了更新を repository rule に従って行う。

## 要件整理

- AC-001/AC-002 の final evidence manifest は Git tag/release、AWS account、CloudFormation stack、DB migration、Allure/docs、RAG evaluation、cost estimate を実値として提出する必要がある。
- 手作業 manifest では current Git commit、package version、CloudFormation inventory の stack/account/region と不整合が起きやすいため、input JSON と final CloudFormation inventory から生成する builder が必要。
- Git tag/release 作成、AWS deploy/publish、CloudFormation capture、final checklist signoff は外部状態変更を伴うため、本タスクでは完了扱いにしない。

## 検討・判断

- manifest の自由記述を直接書くのではなく、`evidence-manifest-input.uat.json` と `cloudformation_inventory.uat.json` を入力にして `evidence_manifest.json` を生成する形にした。
- final candidate validator の ready path まで fixture で通すことで、builder が生成する manifest が既存の final gate と整合することを確認した。
- docs は final acceptance runbook と local verification docs のみ更新し、API や運用境界の変更は行っていない。

## 実施作業

- `tools/final-evidence-manifest.js` を追加し、manifest builder と file I/O wrapper を実装した。
- `tools/build-final-evidence-manifest.js` を追加し、CLI から final manifest を生成できるようにした。
- `tools/check-final-evidence-manifest-fixtures.js` を追加し、positive path、invalid input、AWS account mismatch、final candidate ready path を検査した。
- `package.json` に `acceptance:final-manifest:build` と `acceptance:final-manifest:fixture:check` を追加し、`verify` に組み込んだ。
- `docs/ops/runbooks/final-acceptance.md`、`docs/ops/local-verification.md`、`tools/check-docs.js` を同期した。

## 成果物

- `tools/final-evidence-manifest.js`
- `tools/build-final-evidence-manifest.js`
- `tools/check-final-evidence-manifest-fixtures.js`
- `package.json`
- `docs/ops/runbooks/final-acceptance.md`
- `docs/ops/local-verification.md`
- `tools/check-docs.js`
- `tasks/do/20260527-2339-final-manifest-builder.md`

## 検証

- pass: `npm run acceptance:final-manifest:fixture:check`
- pass: `npm run docs:check`
- pass: `npm run acceptance:final-candidate:fixture:check`
- pass: `npm run acceptance:final-checklist:fixture:check`
- pass: `npm run acceptance:final:check`
- pass: `npm run acceptance:package:check`
- pass: `npm run verify`
- pass: `git diff --check`
- pass: `pre-commit run --files package.json docs/ops/runbooks/final-acceptance.md docs/ops/local-verification.md tools/check-docs.js tools/final-evidence-manifest.js tools/build-final-evidence-manifest.js tools/check-final-evidence-manifest-fixtures.js tasks/do/20260527-2339-final-manifest-builder.md reports/working/20260527-2347-final-manifest-builder.md`

## fit 評価

- task の受け入れ条件は実装・fixture・docs 同期・verify 組み込みの範囲で満たした。
- AC-001/AC-002 の外部 Git release / AWS publish は、本タスクでは生成手順と検査を追加したのみで完了扱いにしていない。

## 未対応・制約・リスク

- `docs/acceptance/final/evidence_manifest.json` の実 final 証跡は未作成。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final checklist signoff は未実施。
- `dist/acceptance/final_readiness.json` の `final_acceptance_ready` は引き続き `false`。
