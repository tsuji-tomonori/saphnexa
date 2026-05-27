# final docs artifact prefix gate 作業完了レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md`、`.workspace/local.md`、`.workspace/Saphnexa_検収受入条件_package_v1.0` に基づき、最終検収受入条件を満たすまで継続する。
- リポジトリルールに従い、task md、検証、commit、PR コメント、作業レポートを残す。

## 要件整理

- 基本設計書 4.3.3 は admin docs の viewer path を `/admin/docs/latest/`、`/admin/docs/versions/{version}/`、S3 prefix を `docs-site/latest/`、`docs-site/releases/{version}/` と定義している。
- final evidence candidate verifier は docs URL の末尾が `/latest/` と `/versions/v0.16/` であることだけを検査しており、設計書準拠 prefix までは保証していなかった。
- external action plan の docs publish command も `docs/` prefix を候補にしており、設計書の `docs-site/*` とずれていた。

## 検討・判断

- final evidence manifest の docs URL は、CloudFront viewer path と S3 origin prefix のどちらでも証跡になり得るため、両方を許容した。
- ただし任意の `/latest/` や `/versions/v0.16/` は通さず、設計書準拠の `/admin/docs/*` または `docs-site/*` に限定した。
- AWS deploy/publish、Git tag/release、CloudFormation capture、final checklist signoff は外部 state 変更のため実施していない。

## 実施作業

- `tools/final-evidence-candidate.js` に docs latest/version URL の設計書準拠 path check を追加した。
- `tools/check-final-evidence-candidate-fixtures.js` に `docs/latest/` と `docs/versions/v0.16/` を reject する fixture を追加した。
- `tools/external-acceptance-actions.js` の docs publish candidate command を `docs-site/latest/` と `docs-site/releases/v0.16/` へ変更した。
- `tools/check-external-acceptance-actions.js` に publish command の prefix 検査を追加した。
- `docs/acceptance/evidence/evidence_manifest.schema.json` と example を `docs-site/*` prefix に同期し、`tools/check-evidence-manifest.js` で固定した。
- `tasks/do/20260527-2015-final-docs-artifact-prefix-gate.md` に作業計画、RCA、受け入れ条件、Done 条件を記録した。

## 成果物

- `tools/final-evidence-candidate.js`
- `tools/check-final-evidence-candidate-fixtures.js`
- `tools/external-acceptance-actions.js`
- `tools/check-external-acceptance-actions.js`
- `docs/acceptance/evidence/evidence_manifest.schema.json`
- `docs/acceptance/evidence/evidence_manifest.example.json`
- `tools/check-evidence-manifest.js`
- `tasks/do/20260527-2015-final-docs-artifact-prefix-gate.md`
- `reports/working/20260527-2018-final-docs-artifact-prefix-gate.md`

## 検証

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run evidence:check`: pass
- `npm run acceptance:external-actions:check`: pass
- `npm run acceptance:final-candidate:check`: pass。final files 未配置のため `not ready` 表示は継続するが、errors なしで exit 0。
- `npm run artifacts:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run verify`: pass

## 指示への fit 評価

- final evidence manifest と external action plan の admin docs artifact path が、基本設計書 4.3.3 の viewer path / S3 prefix 契約へ近づいた。
- この変更は検収完了時の証跡品質を上げるもので、外部 state を変更せず goal 達成へ進む作業として適合する。
- API/UI/RAG 実行経路、認可境界、benchmark 期待値、QA sample 固有値、dataset 固有分岐は変更していない。

## 未対応・制約・リスク

- final acceptance は未完了。`dist/acceptance/final_readiness.json` では `AC-001`、`AC-002`、`AC-004`、`AC-081`、`AC-150`、`AC-151`、`AC-152` が blocker として残る。
- pending action は `release-tag`、`github-release`、`aws-deploy-publish`、`cloudformation-capture`、`final-evidence-candidate`、`final-checklist-signoff`。
- 欠落 final files は `docs/acceptance/final/evidence_manifest.json`、`docs/acceptance/final/acceptance_checklist.csv`、`docs/acceptance/cloudformation/cloudformation_inventory.uat.json`。
- 外部 state を変更する操作は未実施。実施にはユーザー確認が必要。
