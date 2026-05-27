# final numeric and checklist date value gate 作業完了レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` をもとに実装し、`.workspace/local.md` を参考にローカル確認を行う。
- `.workspace/Saphnexa_検収受入条件_package_v1.0` を満たすまで作業を継続する。
- repository ルールに従い、task md、検証、commit/PR 更新、作業レポートを残す。

## 要件整理

- final acceptance は外部状態を伴う GitHub release、AWS/UAT 証跡、final checklist signoff が残っており、現時点では完了扱いにできない。
- 外部操作なしで進められる範囲として、最終証跡候補 validator が不自然な cost estimate や未来確認日を誤って通さないようにする。
- 対象は `cost_estimate.monthly_usd` と final checklist の `確認日`。

## 検討・判断の要約

- AC-140 は月額見積が上限内であることを求めており、`null` や負値は上限内というより証跡として不正な値である。
- AC-004 は checklist の全行に確認日が記入されていることを求めており、未来日は「確認済み」の証跡として扱えない。
- AWS Cost Explorer や検収者署名は外部状態を伴うため行わず、local fixture で validator の拒否条件を固定した。

## 実施作業

- `tools/final-evidence-candidate.js` で `monthly_usd` を finite number、0 以上、550 以下として検査するよう変更。
- `tools/final-evidence-candidate.js` で final checklist の `確認日` が未来日でないことを検査するよう変更。
- `tools/check-final-evidence-candidate-fixtures.js` に `null` / 負値 / 上限超過 cost と未来確認日の invalid fixture を追加。
- `docs/ops/runbooks/final-acceptance.md` に cost estimate の数値範囲と checklist 確認日の未来日拒否を追記。
- `tasks/do/20260527-1814-final-numeric-date-value-gate.md` を作成し、受け入れ条件と検証結果を記録。

## 成果物

- `tools/final-evidence-candidate.js`
- `tools/check-final-evidence-candidate-fixtures.js`
- `docs/ops/runbooks/final-acceptance.md`
- `tasks/do/20260527-1814-final-numeric-date-value-gate.md`

## 検証

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run verify`: pass

## 指示への fit 評価

- 検収 package の AC-004 / AC-140 / AC-150 / AC-151 / AC-152 に向けて、不自然な数値・未来日で最終証跡が ready にならない preflight を強化した。
- `.workspace/local.md` の二段構え方針に沿い、ローカルでは証跡 validator と fixture による検証に限定し、AWS Cost Explorer や署名済み checklist の実取得は pending とした。
- 実施していない Git tag、GitHub release、AWS deploy、CloudFormation 実取得、final signoff は実施済み扱いにしていない。

## 未対応・制約・リスク

- final acceptance は未完了。GitHub release、AWS/UAT 証跡、CloudFormation 実取得、final checklist signoff が残っている。
- 確認日の未来日判定は validator 実行環境の日付を基準にする。CI/検収実行環境の時計が大きくずれている場合、正しい checklist でも invalid になる可能性がある。
