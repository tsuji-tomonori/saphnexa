# final CloudFormation stack status output gate 作業完了レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` をもとに実装し、`.workspace/local.md` を参考にローカル確認を行う。
- `.workspace/Saphnexa_検収受入条件_package_v1.0` を満たすまで作業を継続する。
- repository ルールに従い、task md、検証、commit/PR 更新、作業レポートを残す。

## 要件整理

- final acceptance は外部状態を伴う GitHub release、AWS/UAT 証跡、final checklist signoff が残っており、現時点では完了扱いにできない。
- 外部操作なしで進められる範囲として、final CloudFormation inventory が successful stack status と outputs を欠いたまま ready にならないようにする。
- 対象は normalized final inventory の `stack_status` と `stack_outputs`。

## 検討・判断の要約

- `tools/cloudformation-inventory.js` の final capture instructions は `StackStatus` と `Outputs` を required evidence として列挙している。
- 既存 validator は source / eligibility / manifest consistency / major resource type coverage を確認していたが、stack status と outputs は未検査だった。
- AWS 実取得は外部状態を伴うため行わず、local fixture で successful status/outputs と invalid status/empty outputs の両方を検証した。

## 実施作業

- `tools/final-evidence-candidate.js` に complete 系 `stack_status` と non-empty `stack_outputs` の検査を追加。
- `tools/check-final-evidence-candidate-fixtures.js` の ready fixture に `stack_status` と `stack_outputs` を追加。
- `tools/check-final-evidence-candidate-fixtures.js` に rollback status / empty outputs の invalid fixture を追加。
- `docs/acceptance/cloudformation/cloudformation_inventory.schema.json` に final normalized inventory fields を追記。
- `docs/ops/runbooks/final-acceptance.md` に stack status / outputs の確認観点を追記。
- `tasks/do/20260527-1832-final-cfn-stack-status-output-gate.md` を作成し、受け入れ条件と検証結果を記録。

## 成果物

- `tools/final-evidence-candidate.js`
- `tools/check-final-evidence-candidate-fixtures.js`
- `docs/acceptance/cloudformation/cloudformation_inventory.schema.json`
- `docs/ops/runbooks/final-acceptance.md`
- `tasks/do/20260527-1832-final-cfn-stack-status-output-gate.md`

## 検証

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run cfn:inventory:check`: pass
- `npm run docs:check`: pass
- `npm run verify`: pass

## 指示への fit 評価

- 検収 package の AC-081 / AC-150 / AC-151 / AC-152 に向けて、不十分な CloudFormation final inventory で ready にならない preflight を強化した。
- `.workspace/local.md` の二段構え方針に沿い、ローカルでは証跡 validator と fixture による検証に限定し、AWS CloudFormation 実取得は pending とした。
- 実施していない Git tag、GitHub release、AWS deploy、CloudFormation 実取得、final signoff は実施済み扱いにしていない。

## 未対応・制約・リスク

- final acceptance は未完了。GitHub release、AWS/UAT 証跡、CloudFormation 実取得、final checklist signoff が残っている。
- final normalized inventory の field 名を `stack_status` / `stack_outputs` としているため、実取得正規化手順もこの名前に合わせる必要がある。
