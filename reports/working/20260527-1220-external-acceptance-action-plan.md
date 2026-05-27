# external acceptance action plan 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/local.md` の方針に従い、検収受入条件 package を満たすための実装・検証を継続する。
- 外部状態変更は確認なしに実行せず、未実施項目を完了扱いしない。

## 要件整理

- 残 `requires_aws` の AC-001/002/004/081/150/151/152 は、Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence/checklist signoff に依存する。
- ローカルでは外部実行そのものではなく、必要 action、対象 AC、候補コマンド、事前確認、証跡出力を pending として機械検査する。
- final readiness と acceptance package は、外部 action が pending の間は final ready を返さない。

## 検討・判断

- 実 GitHub release、AWS deploy、S3 sync、CloudFormation describe/list は外部状態変更のため実行しない。
- `dist/acceptance/external_action_plan.json` を draft artifact として生成し、check script で全 action が `pending`、`requires_confirmation=true`、`external_state_change=true` のまま残ることを検査する。
- traceability の対象 AC は `requires_aws` のまま維持し、action plan で追跡していることだけを追記した。

## 実施作業

- `tools/external-acceptance-actions.js`、`tools/build-external-acceptance-actions.js`、`tools/check-external-acceptance-actions.js` を追加。
- final readiness に `external_action_gate` を追加し、acceptance package manifest/summary に external action plan の path と pending 件数を含めた。
- `package.json`、`Taskfile.yml`、CI workflow、admin test report、docs check を新コマンドに同期。
- `docs/ops/local-verification.md` と `docs/acceptance/traceability.md` を更新。

## 成果物

- `dist/acceptance/external_action_plan.json` を生成可能。
- readiness/package が external action の pending 状態を検査可能。
- `tasks/done/20260527-1214-external-acceptance-action-plan.md` に受け入れ条件と検証結果を記録。

## 検証

- `npm run acceptance:external-actions:build`: pass
- `npm run acceptance:external-actions:check`: pass
- `npm run acceptance:final:build`: pass
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:build`: pass
- `npm run acceptance:package:check`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `npm run acceptance:check`: pass
- `npm run admin-artifacts:build`: pass
- `npm run artifacts:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files ...`: pass

## Fit 評価

- AC-001/002/004/081/150/151/152 の外部作業を action plan で追跡し、未実行のまま完了扱いしない gate を追加したため、指示に適合。
- 実外部操作は実行していないため、検収完了ではなく final acceptance 前の action plan 整備として partial progress。

## 未対応・制約・リスク

- Git tag/release、AWS deploy/publish、CloudFormation 実 capture、final evidence 作成、checklist signoff は未実行。
- AC-001/002/004/081/150/151/152 は `requires_aws` のまま。
- GitHub Actions の最新実行結果は、push 後に確認する。
