# finalization command order builders 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と検収受入条件 package v1.0 を満たすまで実装・検証を継続する。
- 外部状態変更は確認なしに実行せず、ローカルで進められる検収準備を進める。

## 要件整理

- final manifest build は CloudFormation inventory を必要とするため、runbook では CloudFormation capture / normalize 後に案内する必要がある。
- `final_readiness.json` の `finalization_commands` に、実 final artifact を作る builder / normalizer command を含める必要がある。
- docs check と readiness check が順序契約を検査すること。

## 検討・判断

- manifest builder の default input は `docs/acceptance/cloudformation/cloudformation_inventory.uat.json` なので、runbook の manifest build を normalizer の後ろへ移動した。
- readiness の finalization command list は、外部作業の完了を主張するものではなく、最終化時に実行すべき command の順序証跡として更新した。
- 外部 state を変更する AWS / GitHub release / signoff は実行していない。

## 実施作業

- `docs/ops/runbooks/final-acceptance.md` の手順を CloudFormation raw capture / normalizer -> final manifest build -> final checklist build の順へ修正した。
- `tools/final-acceptance-readiness.js` の `finalization_commands` に `CFN_CAPTURED_AT=<capture-iso-timestamp> npm run cfn:inventory:normalize`、`npm run acceptance:final-manifest:build`、`npm run acceptance:final-checklist:build` を追加した。
- `tools/check-final-acceptance-readiness.js` に command list と順序の検査を追加した。
- `tools/check-docs.js` に final acceptance runbook の順序検査を追加した。

## 成果物

- `docs/ops/runbooks/final-acceptance.md`
- `tools/final-acceptance-readiness.js`
- `tools/check-final-acceptance-readiness.js`
- `tools/check-docs.js`
- `tasks/do/20260528-0009-finalization-command-order-builders.md`

## 検証

- pass: `npm run docs:check`
- pass: `npm run acceptance:final:check`
- pass: `npm run acceptance:package:check`
- pass: `npm run verify`
- pass: `git diff --check`
- pass: `pre-commit run --files docs/ops/runbooks/final-acceptance.md tools/final-acceptance-readiness.js tools/check-final-acceptance-readiness.js tools/check-docs.js tasks/do/20260528-0009-finalization-command-order-builders.md reports/working/20260528-0009-finalization-command-order-builders.md`

## fit 評価

- runbook と readiness command list の順序同期という今回の task 要件は満たした。
- final acceptance 自体は Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final checklist signoff が未実施のため未完了。

## 未対応・制約・リスク

- 実 CloudFormation capture と final manifest/checklist 作成は未実施。
- `final_acceptance_ready` は引き続き `false`。
