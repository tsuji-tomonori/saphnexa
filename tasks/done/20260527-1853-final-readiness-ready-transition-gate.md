# final readiness ready transition gate

状態: done

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0` の完了条件は、P0/P1/P2 全項目 PASS、全 checklist 記入、Blocker/Critical defect 0、検収対象 commit/tag/CDK/DB/docs/Allure 証跡 manifest 記録を求めている。

現状の `tools/final-evidence-candidate.js` は final manifest / final checklist / final CloudFormation inventory が揃った場合の ready 判定を持つ。一方、`tools/final-acceptance-readiness.js` と `tools/check-final-acceptance-readiness.js` は local preflight の pending 状態を固定検査しており、final candidate が ready になった後に `final_acceptance_ready: true` へ遷移できることを検証していない。

## 目的

final candidate ready 後に final readiness が true へ遷移できる gate を実装し、local preflight では pending を維持しつつ、最終証跡が揃ったときの完了判定を fixture で検証できるようにする。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の final readiness builder/checker は、final files が未配置の local preflight では正しく pending を示すが、final candidate ready 後に `final_acceptance_ready: true` へ遷移できることを証明する検査がない。

### 確認済み事実

- `tools/final-evidence-candidate.js` は final manifest / checklist / CloudFormation inventory の ready 判定を持つ。
- `tools/check-final-evidence-candidate-fixtures.js` は ready fixture を作成し、final candidate が `ready: true` になることを検査している。
- `tools/final-acceptance-readiness.js` は `final_acceptance_ready: false`、release/aws/checklist gate ready false を固定値として出力している。
- `tools/check-final-acceptance-readiness.js` は `readiness.final_acceptance_ready === false` と各 gate pending を固定的に期待している。
- `docs/acceptance/traceability.md` は外部証跡未取得の現状を `requires_aws` として残している。

### 推定原因

- readiness は local preflight guard として先に作られ、final candidate ready 後の完成状態を表す contract が後続で追加されなかった。
- local preflight の安全性を優先したため、ready への遷移を fixture で検証する観点が不足した。

### 根本原因

- final readiness の状態遷移が「pending を誤って complete と言わない」片方向だけで検査されていた。
- final candidate ready を入力にした aggregate gate の positive path が存在しなかった。

### 影響範囲

- `npm run acceptance:final:check`
- final acceptance readiness JSON
- finalization command sequence
- AC-001 / AC-002 / AC-004 / AC-081 / AC-150 / AC-151 / AC-152 の aggregate gate

### 対策

- final readiness builder を final candidate ready 状態から aggregate ready を算出できる構造にする。
- local preflight では現状どおり `final_acceptance_ready: false` と external pending を維持する。
- final ready fixture を追加し、final candidate ready / no blocker / no pending external action のとき `final_acceptance_ready: true` になることを検査する。
- 既存 final readiness check は local preflight の pending guard として維持する。

## スコープ

- 対象:
  - `tools/final-acceptance-readiness.js`
  - `tools/check-final-acceptance-readiness.js`
  - `tools/check-final-acceptance-readiness-fixtures.js`
  - `package.json`
  - task/report
- 対象外:
  - final evidence manifest/checklist/CloudFormation inventory 実ファイルの作成
  - Git tag / GitHub Release 作成
  - AWS deploy / publish / CloudFormation 実取得
  - final checklist signoff

## 実装計画

1. final readiness builder に dependency injection 可能な options を追加する。
2. final candidate ready の場合、release/aws/checklist/external/artifact aggregate gates が ready へ遷移できる算出にする。
3. local preflight check が pending 状態を維持することを明示的に検査し続ける。
4. final ready fixture check を追加する。
5. npm script と verify sequence に fixture check を追加する。
6. 関連検証、作業レポート、commit、push、PR コメントまで反映する。

## ドキュメント保守計画

- readiness JSON の contract は tool と generated output で表現する。
- 運用 runbook の最終コマンド順に fixture check の追加が必要か確認する。

## 受け入れ条件

- [x] local preflight では `final_acceptance_ready: false` と外部 pending action が維持される。
- [x] fixture で final candidate ready / external actions complete / artifact summary ready の場合に `final_acceptance_ready: true` を検証できる。
- [x] final ready fixture で P0/P1/P2 gates が true になる。
- [x] final ready fixture で release/aws/checklist/final_candidate/external_action/artifact_summary gates が true になる。
- [x] 既存 final candidate validator と external action pending guard を弱めない。
- [x] 外部状態を変更せず、現 worktree の実 readiness は pending のまま維持する。

## Done 条件

- [x] 実装差分が PR branch に commit / push されている。
- [x] 受け入れ条件確認コメントとセルフレビューコメントを PR に投稿している。
- [x] task md に PR コメント URL と検証結果を記録し、`tasks/done/` へ移動している。
- [x] 作業レポートを `reports/working/` に保存している。

## 検証計画

- `npm run acceptance:final:fixture:check`
- `npm run acceptance:final:check`
- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:external-actions:check`
- `npm run acceptance:package:check`
- `npm run docs:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- `npm run acceptance:final:fixture:check`: pass
- `npm run acceptance:final:check`: pass（local preflight は `final_acceptance_ready: false` / `pending_external_actions` を維持）
- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:external-actions:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run verify`: pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553490778
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553493818
- GitHub Apps comment は既知の 403 `Resource not accessible by integration` のため、`gh pr comment` fallback で投稿した。

## PR レビュー観点

- local preflight が誤って complete にならないか。
- final candidate ready 後の positive path が aggregate gate として妥当か。
- external action pending guard と final ready fixture が混同されていないか。
- 未実施の外部操作を実施済み扱いしていないか。

## リスク

- readiness builder に options を追加するため、通常実行パスと fixture パスの差が大きくなりすぎないようにする必要がある。
