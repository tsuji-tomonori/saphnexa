# final rag evaluation report path gate 作業完了レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md`、`.workspace/local.md`、`.workspace/Saphnexa_検収受入条件_package_v1.0` に基づき、最終検収受入条件を満たすまで継続する。
- リポジトリルールに従い、task md、検証、commit、PR コメント、作業レポートを残す。

## 要件整理

- 基本設計書 4.3.3 / 8.4.2 は評価 HTML レポートの viewer path を `/admin/evaluation-reports/{evaluation_run_id}/`、S3 prefix を `reports/evaluations/{evaluation_run_id}/` と定義している。
- final evidence candidate verifier は `rag_evaluation.report_url` が final http(s) / s3 URL であることだけを検査していた。
- ready fixture と example manifest は、設計書の評価 HTML レポート path と `evaluation_run_id` の一致を表していなかった。

## 検討・判断

- final evidence manifest の `rag_evaluation.report_url` は、CloudFront viewer path と S3 origin prefix のどちらでも証跡になり得るため、両方を許容した。
- 任意の RAG JSON や unrelated report path は通さず、`evaluation_run_id` と一致する evaluation report path に限定した。
- RAG 評価ロジックや評価実行は変更せず、final evidence の証跡 URL 検査だけを強化した。
- AWS deploy/publish、Git tag/release、CloudFormation capture、final checklist signoff は外部 state 変更のため実施していない。

## 実施作業

- `tools/final-evidence-candidate.js` に evaluation report path helper を追加し、`rag_evaluation.report_url` と `evaluation_run_id` の一致を検査した。
- `tools/check-final-evidence-candidate-fixtures.js` に `evaluation_run_id` と一致しない report URL fixture を追加した。
- `docs/acceptance/evidence/evidence_manifest.schema.json` に evaluation report URL pattern を追加した。
- `docs/acceptance/evidence/evidence_manifest.example.json` の `rag_evaluation.report_url` を `reports/evaluations/{evaluation_run_id}/` に変更した。
- `tools/check-evidence-manifest.js` で schema pattern と example path を固定した。
- `tasks/do/20260527-2034-final-rag-evaluation-report-path-gate.md` に作業計画、RCA、受け入れ条件、Done 条件を記録した。

## 成果物

- `tools/final-evidence-candidate.js`
- `tools/check-final-evidence-candidate-fixtures.js`
- `docs/acceptance/evidence/evidence_manifest.schema.json`
- `docs/acceptance/evidence/evidence_manifest.example.json`
- `tools/check-evidence-manifest.js`
- `tasks/do/20260527-2034-final-rag-evaluation-report-path-gate.md`
- `reports/working/20260527-2036-final-rag-evaluation-report-path-gate.md`

## 検証

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run evidence:check`: pass
- `npm run acceptance:final-candidate:check`: pass。final files 未配置のため `not ready` 表示は継続するが、errors なしで exit 0。
- `npm run acceptance:package:check`: pass
- `npm run verify`: pass

## 指示への fit 評価

- final evidence manifest の RAG evaluation report URL が、基本設計書の評価 HTML レポート path 契約へ近づいた。
- この変更は検収完了時の証跡品質を上げるもので、外部 state を変更せず goal 達成へ進む作業として適合する。
- API/UI/RAG 実行経路、認可境界、benchmark 期待値、QA sample 固有値、dataset 固有分岐は変更していない。

## 未対応・制約・リスク

- final acceptance は未完了。`dist/acceptance/final_readiness.json` では `AC-001`、`AC-002`、`AC-004`、`AC-081`、`AC-150`、`AC-151`、`AC-152` が blocker として残る。
- pending action は `release-tag`、`github-release`、`aws-deploy-publish`、`cloudformation-capture`、`final-evidence-candidate`、`final-checklist-signoff`。
- 欠落 final files は `docs/acceptance/final/evidence_manifest.json`、`docs/acceptance/final/acceptance_checklist.csv`、`docs/acceptance/cloudformation/cloudformation_inventory.uat.json`。
- 外部 state を変更する操作は未実施。実施にはユーザー確認が必要。
