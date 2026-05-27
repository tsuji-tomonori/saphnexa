# final cost assumption gate 作業完了レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md`、`.workspace/local.md`、`.workspace/Saphnexa_検収受入条件_package_v1.0` に基づき、最終検収受入条件を満たすまで継続する。
- リポジトリルールに従い、task md、検証、commit、PR コメント、作業レポートを残す。

## 要件整理

- AC-140 は 50 DAU / 10 questions/user/day 前提で月額見積が 550 USD 以下であることを要求する。
- `npm run cost:check` は local cost estimate の前提語句を検査済みだが、final evidence candidate verifier は `cost_estimate.assumption` が final text であることのみ検査していた。
- final candidate gate でも `50 DAU` と `10 questions/user/day` の前提を検出対象にする。

## 検討・判断

- cost estimate の金額や line items は変更せず、final evidence manifest の診断条件のみを強化した。
- error label は既存の manifest check 命名に合わせ、`manifest.cost_estimate.assumption_usage_basis` とした。
- 外部 state を変更する Git tag / GitHub release / AWS deploy / CloudFormation capture / final checklist signoff は実施せず、pending のまま維持した。

## 実施作業

- `tools/final-evidence-candidate.js` に `hasUsageBasis` helper と `cost_estimate.assumption_usage_basis` check を追加した。
- `tools/check-final-evidence-candidate-fixtures.js` に cost assumption 前提欠落 fixture を追加し、該当 error label を検出する regression を固定した。
- `tasks/do/20260527-2005-final-cost-assumption-gate.md` に作業計画、RCA、受け入れ条件、Done 条件を記録した。

## 成果物

- `tools/final-evidence-candidate.js`
- `tools/check-final-evidence-candidate-fixtures.js`
- `tasks/do/20260527-2005-final-cost-assumption-gate.md`
- `reports/working/20260527-2008-final-cost-assumption-gate.md`

## 検証

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass。final files 未配置のため `not ready` 表示は継続するが、errors なしで exit 0。
- `npm run cost:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run evidence:check`: pass
- `npm run verify`: pass

## 指示への fit 評価

- final candidate verifier が AC-140 の cost 前提を検査するようになり、local cost checker と final manifest checker の検査差分を縮小した。
- API/UI/RAG 実行経路や認可境界には触れていない。
- docs 更新は不要と判断した。既存 acceptance catalog と local cost checker は前提を明示済みで、今回の変更は最終候補検査の追加に限定されるため。

## 未対応・制約・リスク

- final acceptance は未完了。`dist/acceptance/final_readiness.json` では `AC-001`、`AC-002`、`AC-004`、`AC-081`、`AC-150`、`AC-151`、`AC-152` が blocker として残る。
- pending action は `release-tag`、`github-release`、`aws-deploy-publish`、`cloudformation-capture`、`final-evidence-candidate`、`final-checklist-signoff`。
- 欠落 final files は `docs/acceptance/final/evidence_manifest.json`、`docs/acceptance/final/acceptance_checklist.csv`、`docs/acceptance/cloudformation/cloudformation_inventory.uat.json`。
- 外部 state を変更する操作は未実施。実施にはユーザー確認が必要。
