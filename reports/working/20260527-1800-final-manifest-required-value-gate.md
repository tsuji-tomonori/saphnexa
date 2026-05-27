# final manifest required value gate 作業完了レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` をもとに実装し、`.workspace/local.md` を参考にローカル確認を行う。
- `.workspace/Saphnexa_検収受入条件_package_v1.0` を満たすまで作業を継続する。
- repository ルールに従い、task md、検証、commit/PR 更新、作業レポートを残す。

## 要件整理

- final acceptance は外部状態を伴う GitHub release、AWS/UAT 証跡、final checklist signoff が残っており、現時点では完了扱いにできない。
- 外部操作なしで進められる範囲として、最終証跡候補 validator が空または draft の manifest 重要値を誤って通さないようにする。
- 対象は `cdk_app_version`、`db_migration.tool`、`db_migration.latest_version`、`cost_estimate.assumption`。

## 検討・判断の要約

- 受入条件は「manifest に記録されている」ことを求めており、key の存在だけでは最終証跡として弱い。
- `db_migration.tool` は受入条件例と既存実装方針に合わせて `Flyway` 固定とした。
- version や assumption の文字列形式は将来変わり得るため、過度な正規表現ではなく既存の `isFinalText` による draft/pending/placeholder 拒否に合わせた。

## 実施作業

- `tools/final-evidence-candidate.js` に manifest required value checks を追加。
- `tools/check-final-evidence-candidate-fixtures.js` に invalid required values fixture を追加。
- `docs/ops/runbooks/final-acceptance.md` に manifest 必須値が空・draft/pending ではないことを追記。
- `tasks/do/20260527-1758-final-manifest-required-value-gate.md` を作成し、受け入れ条件と検証結果を記録。

## 成果物

- `tools/final-evidence-candidate.js`
- `tools/check-final-evidence-candidate-fixtures.js`
- `docs/ops/runbooks/final-acceptance.md`
- `tasks/do/20260527-1758-final-manifest-required-value-gate.md`

## 検証

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run verify`: pass

## 指示への fit 評価

- 検収 package の AC-001 / AC-002 / AC-004 / AC-150 / AC-151 / AC-152 に向けて、最終証跡が不完全な値で ready にならない preflight を強化した。
- `.workspace/local.md` の二段構え方針に沿い、ローカルでは証跡 validator と fixture による検証に限定し、AWS 実サービス検証は pending とした。
- 実施していない Git tag、GitHub release、AWS deploy、final signoff は実施済み扱いにしていない。

## 未対応・制約・リスク

- final acceptance は未完了。GitHub release、AWS/UAT 証跡、CloudFormation 実取得、final checklist signoff が残っている。
- `db_migration.tool` は `Flyway` 固定。将来 migration tool を変更する場合は validator と受入証跡 schema の更新が必要。
