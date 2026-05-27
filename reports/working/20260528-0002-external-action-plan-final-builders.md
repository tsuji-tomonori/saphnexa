# external action plan final builders 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と検収受入条件 package v1.0 を満たすまで実装・検証を継続する。
- 外部状態変更は確認なしに実行せず、ローカルで進められる検収準備を進める。

## 要件整理

- external action plan が final acceptance runbook と同じ builder / normalizer 手順を案内できること。
- CloudFormation capture action が raw AWS 取得後の normalized inventory 作成まで示すこと。
- final evidence candidate action が manifest / checklist の生成後に validator を実行する順序を示すこと。
- external action は pending / requires_confirmation / external_state_change のまま維持すること。

## 検討・判断

- runbook は既に `npm run cfn:inventory:normalize`、`npm run acceptance:final-manifest:build`、`npm run acceptance:final-checklist:build` を記載しているため、docs 追加ではなく external action plan の同期漏れを修正した。
- checker に command 存在だけでなく、manifest/checklist build が final candidate check より前にあることも検査させた。
- 実 AWS capture、Git release、final signoff は外部状態変更または署名確認を伴うため実行していない。

## 実施作業

- `tools/external-acceptance-actions.js` の `cloudformation-capture` に normalizer command を追加した。
- `tools/external-acceptance-actions.js` の `final-evidence-candidate` に manifest builder / checklist builder command を追加した。
- `tools/check-external-acceptance-actions.js` に builder / normalizer command と順序の検査を追加した。

## 成果物

- `tools/external-acceptance-actions.js`
- `tools/check-external-acceptance-actions.js`
- `tasks/do/20260528-0002-external-action-plan-final-builders.md`

## 検証

- pass: `npm run acceptance:external-actions:check`
- pass: `npm run docs:check`
- pass: `npm run acceptance:final:check`
- pass: `npm run acceptance:package:check`
- pass: `npm run verify`
- pass: `git diff --check`
- pass: `pre-commit run --files tools/external-acceptance-actions.js tools/check-external-acceptance-actions.js tasks/do/20260528-0002-external-action-plan-final-builders.md reports/working/20260528-0002-external-action-plan-final-builders.md`

## fit 評価

- external action plan と final acceptance runbook の同期という今回の task 要件は満たした。
- final acceptance 自体は Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final checklist signoff が未実施のため未完了。

## 未対応・制約・リスク

- 外部 action は候補 command を明示したのみで実行していない。
- `final_acceptance_ready` は引き続き `false`。
