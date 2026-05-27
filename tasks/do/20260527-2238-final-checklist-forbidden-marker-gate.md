# final checklist forbidden marker gate

- 状態: do
- タスク種別: 機能追加
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

final evidence manifest は全 string 値で `draft` / `placeholder` / `example` / `pending` / `not-for-acceptance` を拒否するようになっている。一方、final acceptance checklist は `結果` / `証跡リンク` / `確認者` / `確認日` と draft status marker を検査しているが、`備考` などのその他セルに `draft` / `placeholder` / `example` / `not-for-acceptance` が残っても final candidate が ready になり得る。

## 目的

final acceptance checklist の任意セルに draft / placeholder 系 marker が残っている場合、final candidate を ready にしない。

## スコープ

- `tools/final-evidence-candidate.js` の checklist validation に行全体の forbidden marker 検査を追加する。
- `tools/check-final-evidence-candidate-fixtures.js` に `備考` へ `draft` marker を含める invalid fixture を追加する。

## スコープ外

- final acceptance checklist の実作成または署名
- Git tag/release の作成
- AWS deploy/publish
- CloudFormation capture

## 受け入れ条件

- [ ] final acceptance checklist の任意セルに `draft` / `placeholder` / `example` / `pending` / `not-for-acceptance` が含まれる場合、final candidate validator が `checklist.<AC-ID>.no_forbidden_markers` として拒否する。
- [ ] `備考` に forbidden marker がある fixture が ready にならない。
- [ ] 既存の ready fixture は引き続き ready になる。
- [ ] final acceptance の外部残件を完了扱いしない。
- [ ] 変更範囲に見合う検証を実行し、結果を task / report / PR コメントに残す。

## Done 条件

- [ ] 実装と fixture を追加する。
- [ ] 選定した検証コマンドが pass する。
- [ ] 作業レポートを `reports/working/` に作成する。
- [ ] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [ ] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. checklist 行の全値を連結し、manifest と同じ forbidden marker helper で検査する。
2. 既存の `no_draft_status` は final status marker 専用として残し、新しい `no_forbidden_markers` を追加する。
3. `備考` に `draft` を含む fixture を追加し、final candidate が invalid になることを確認する。

## ドキュメント保守方針

final runbook は既に draft / placeholder ではない実証跡提出を要求しているため、docs 本文の追加更新は不要。実装差分、task、report、PR コメントに gate 強化内容を記録する。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## PR セルフレビュー観点

- docs と実装の同期
- 変更範囲に見合うテスト
- RAG の根拠性・認可境界を弱めていないこと
- benchmark 期待語句・QA sample 固有値・dataset 固有分岐を実装へ入れていないこと

## リスク

- final checklist の自由記述欄でも `draft` などの語が使えなくなる。final 提出物から非最終 marker を排除する目的には合っているため、最終証跡として妥当な制約と判断する。
