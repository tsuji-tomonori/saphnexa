# final checklist value format gate

状態: do

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0` の AC-004 は、最終 checklist の全行に結果、証跡リンク、確認者、確認日が記入されていることを求めている。現状の final evidence candidate validator は final checklist の各セルが空でなく draft marker を含まないことを検査しているが、`証跡リンク` が URL 形式であることや、`確認日` が日付形式であることまでは検査していない。

## 目的

final acceptance checklist で、証跡リンクが URL として妥当でない、確認者が final reviewer として妥当でない、確認日が `YYYY-MM-DD` 形式でない場合を検出する。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の final evidence candidate validator で、final checklist の `証跡リンク` に任意文字列、`確認日` に任意文字列が入っていても、空でなく draft marker を含まなければ検査を通過し得る。

### 確認済み事実

- `tools/final-evidence-candidate.js` の `validateChecklist` は `結果`、`証跡リンク`、`確認者`、`確認日` に `isFinalText` を適用している。
- `isFinalText` は空文字と `pending/example/draft/placeholder/not-for-acceptance` を拒否するが、URL 形式や日付形式は検査しない。
- `tools/check-final-evidence-candidate-fixtures.js` の ready fixture は URL と `2026-05-27` を入れているが、invalid fixture は証跡リンク形式や日付形式の不正を検査していない。

### 推定原因

- final checklist の初期 validator は「未記入セル 0件」と draft marker 排除を優先し、セルの意味に応じた型・形式検査が後続になった。
- fixture が `結果=PASS` と source column consistency を中心にしており、final checklist の個別 value format をカバーしていなかった。

### 根本原因

- AC-004 の「証跡リンク」「確認日」を単なる非空文字として扱い、最終提出物として検収可能な形式を validator に明示していなかった。
- checklist field ごとの validator と fixture が不足していた。

### 影響範囲

- final evidence candidate validator。
- AC-004 / AC-150 / AC-151 / AC-152 の最終判定前 preflight。
- final acceptance runbook の検証項目。

### 対策

- `証跡リンク` は `https://` または `s3://` の final artifact URL であることを検査する。
- `確認日` は `YYYY-MM-DD` の実在日付であることを検査する。
- `確認者` は final text であり、空白だけや draft marker を拒否する。
- invalid fixture に不正証跡リンク、不正確認日、不正確認者を追加する。
- runbook に final checklist value format を明記する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - `docs/ops/runbooks/final-acceptance.md`
- 対象外:
  - final checklist の作成・署名
  - Git tag / release 作成
  - AWS deploy / publish

## 実装計画

1. checklist value format helper を追加する。
2. `validateChecklist` で `証跡リンク`、`確認者`、`確認日` の形式検査を追加する。
3. fixture に invalid checklist value format ケースを追加する。
4. runbook を更新する。
5. 関連検証を実行する。

## ドキュメント保守計画

- `docs/ops/runbooks/final-acceptance.md` に final checklist の `証跡リンク` と `確認日` の形式要件を追記する。

## 受け入れ条件

- [x] final checklist の `証跡リンク` が `https://` または `s3://` URL でない場合、validator が invalid として検出する。
- [x] final checklist の `確認日` が `YYYY-MM-DD` の実在日付でない場合、validator が invalid として検出する。
- [x] final checklist の `確認者` が空白または draft marker の場合、validator が invalid として検出する。
- [x] valid fixture は引き続き ready と判定される。
- [x] runbook が final checklist の証跡リンク・確認日形式要件を明記する。
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
- `pre-commit run --files docs/ops/runbooks/final-acceptance.md tools/final-evidence-candidate.js tools/check-final-evidence-candidate-fixtures.js tasks/do/20260527-1740-final-checklist-value-format-gate.md`: pass

## PR レビュー観点

- final checklist の値形式が目的に合う厳しさになっているか。
- 既存の source column / row count / PASS / no draft marker checks を弱めていないか。
- fixture が ready と invalid value format の両方をカバーしているか。
- 外部状態変更が含まれていないか。

## リスク

- 証跡リンクをローカルファイルパスで提出する運用は拒否される。最終検収では GitHub Actions / GitHub release / CloudFront / S3 などの URL を提出する前提。
- `確認日` は日付のみを許容し、時刻付き ISO string は拒否する。最終 checklist は日付欄であるため許容する。
