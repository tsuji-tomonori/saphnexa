# final CloudFormation major resource gate 作業完了レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` をもとに実装し、`.workspace/local.md` を参考にローカル確認を行う。
- `.workspace/Saphnexa_検収受入条件_package_v1.0` を満たすまで作業を継続する。
- repository ルールに従い、task md、検証、commit/PR 更新、作業レポートを残す。

## 要件整理

- final acceptance は外部状態を伴う GitHub release、AWS/UAT 証跡、final checklist signoff が残っており、現時点では完了扱いにできない。
- 外部操作なしで進められる範囲として、final CloudFormation inventory が主要 resource type を欠いたまま ready にならないようにする。
- 対象は `stack_resources[].ResourceType` と local CDK intent の `expectedMajorResourceTypes` の照合。

## 検討・判断の要約

- AC-081 は主要リソース種別と個数の一致を求めているため、`stack_resources` が 1 件以上という検査だけでは弱い。
- 既存の local CDK intent が `expectedMajorResourceTypes` を持っているため、final candidate validator でも同じリストを使って主要 resource type の欠落を検出することにした。
- AWS 実取得は外部状態を伴うため行わず、local fixture で主要 resource type 網羅と欠落の両方を検証した。

## 実施作業

- `tools/final-evidence-candidate.js` で final CloudFormation inventory の `stack_resources[].ResourceType` が `expectedMajorResourceTypes` を全件含むことを検査。
- `tools/check-final-evidence-candidate-fixtures.js` の ready fixture を主要 resource type 全件に対応させた。
- `tools/check-final-evidence-candidate-fixtures.js` に major resource type 欠落の invalid fixture を追加。
- `docs/ops/runbooks/final-acceptance.md` に主要 resource type 網羅の確認観点を追記。
- `tasks/do/20260527-1823-final-cfn-major-resource-gate.md` を作成し、受け入れ条件と検証結果を記録。

## 成果物

- `tools/final-evidence-candidate.js`
- `tools/check-final-evidence-candidate-fixtures.js`
- `docs/ops/runbooks/final-acceptance.md`
- `tasks/do/20260527-1823-final-cfn-major-resource-gate.md`

## 検証

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run verify`: pass

## 指示への fit 評価

- 検収 package の AC-081 / AC-150 / AC-151 / AC-152 に向けて、不十分な CloudFormation final inventory で ready にならない preflight を強化した。
- `.workspace/local.md` の二段構え方針に沿い、ローカルでは証跡 validator と fixture による検証に限定し、AWS CloudFormation 実取得は pending とした。
- 実施していない Git tag、GitHub release、AWS deploy、CloudFormation 実取得、final signoff は実施済み扱いにしていない。

## 未対応・制約・リスク

- final acceptance は未完了。GitHub release、AWS/UAT 証跡、CloudFormation 実取得、final checklist signoff が残っている。
- `expectedMajorResourceTypes` が CDK intent とずれた場合、final inventory が正しくても invalid になる可能性がある。その場合は CDK intent と受入条件側を同時に更新する必要がある。
