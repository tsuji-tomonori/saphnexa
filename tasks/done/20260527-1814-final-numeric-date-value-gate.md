# final numeric and checklist date value gate

状態: done

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0` は、cost estimate が月額上限内であることと、final checklist の全行に確認日が記入されていることを求めている。現状の final evidence candidate validator は `cost_estimate.monthly_usd <= 550` と `確認日` が `YYYY-MM-DD` の実在日付であることを検査するが、`monthly_usd` が `null` の場合や負値の場合、また `確認日` が未来日の場合を十分に拒否していない。

## 目的

final evidence candidate の検査で、費用見積の数値が有限・非負・上限内であることと、final checklist の確認日が未来日ではないことを保証し、不自然な最終証跡で AC-004 / AC-140 / AC-150 / AC-151 / AC-152 を満たした扱いにしない。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の final evidence candidate validator で、`cost_estimate.monthly_usd` が `null` または負値でも `<= 550` 判定を通過し得る。また、final checklist の `確認日` が実在する未来日でも ISO date として通過し得る。

### 確認済み事実

- `tools/final-evidence-candidate.js` は `Number(manifest.cost_estimate?.monthly_usd) <= 550` を検査している。
- JavaScript では `Number(null) === 0` のため、`monthly_usd: null` は上限検査だけなら通過し得る。
- `monthly_usd: -1` は `<= 550` を満たすが、月額見積としては不正である。
- `tools/final-evidence-candidate.js` の `isIsoDate` は実在日付かを検査するが、未来日かどうかは検査していない。
- final checklist は「確認者が確認済みである」ことを前提にしており、未来の確認日は最終証跡として不適切である。

### 推定原因

- cost estimate の初期 validator は上限超過を防ぐことを優先し、数値型や下限の検査が後続課題として残った。
- checklist date の初期 validator は形式と実在性の検査を優先し、検証実行日との相対関係は未実装だった。

### 根本原因

- 数値・日付の「形式として妥当」と「最終証跡として妥当」を分けた不変条件が不足していた。
- fixture が cost estimate の型/下限と未来確認日を扱っていなかった。

### 影響範囲

- final evidence candidate validator。
- AC-004 / AC-140 / AC-150 / AC-151 / AC-152 の最終判定前 preflight。
- final acceptance runbook の cost estimate / checklist 確認観点。

### 対策

- `cost_estimate.monthly_usd` を finite number、`>= 0`、`<= 550` として検査する。
- final checklist の `確認日` が実在日付で、検証実行日以前であることを検査する。
- fixture に `monthly_usd: null`、負値、未来確認日を含む invalid ケースを追加する。
- runbook に cost estimate と checklist date の最終値条件を追記する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - `docs/ops/runbooks/final-acceptance.md`
- 対象外:
  - AWS Cost Explorer 実取得
  - final checklist signoff
  - GitHub release / AWS deploy / CloudFormation capture

## 実装計画

1. `monthly_usd` の finite number / non-negative / upper limit check を追加する。
2. checklist `確認日` の未来日拒否 check を追加する。
3. fixture に invalid cost/date ケースを追加する。
4. final acceptance runbook に確認観点を追記する。
5. 検証結果と PR コメント URL を task に記録する。

## ドキュメント保守計画

- `docs/ops/runbooks/final-acceptance.md` に、cost estimate の数値範囲と checklist 確認日の未来日拒否を追記する。

## 受け入れ条件

- [x] `cost_estimate.monthly_usd` が `null` の場合、validator が invalid として検出する。
- [x] `cost_estimate.monthly_usd` が負値の場合、validator が invalid として検出する。
- [x] `cost_estimate.monthly_usd` が 550 を超える場合、validator が invalid として検出する。
- [x] checklist の `確認日` が未来日の場合、validator が invalid として検出する。
- [x] valid fixture は引き続き ready と判定される。
- [x] 外部状態を変更せず、release / AWS / final signoff の pending 状態を維持する。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run docs:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files docs/ops/runbooks/final-acceptance.md tools/final-evidence-candidate.js tools/check-final-evidence-candidate-fixtures.js tasks/do/20260527-1814-final-numeric-date-value-gate.md reports/working/20260527-1817-final-numeric-date-value-gate.md`: pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553198930
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553201318
- GitHub Apps comment は既に 403 `Resource not accessible by integration` を確認済みのため、`gh pr comment` で代替した。

## PR レビュー観点

- cost estimate の型、下限、上限を過不足なく検査しているか。
- final checklist の確認日が実在日付かつ未来日でないことを検査しているか。
- 外部状態変更が含まれていないか。

## リスク

- 確認日の未来日判定は validator 実行環境の日付を基準にする。CI/検収実行環境の時計が大きくずれている場合、正しい checklist でも invalid になる可能性がある。
