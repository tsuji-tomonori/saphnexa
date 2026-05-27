# final checklist source order gate

- 状態: do
- タスク種別: 機能追加
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

final checklist validator は、全 AC ID が存在し、各行の source catalog 内容と final result / evidence / reviewer / checked date が妥当であることを検査している。一方で、最終提出 checklist が source catalog の行順を保つこと、ID が一意であることは明示的な gate になっていない。

## 目的

final checklist が `docs/acceptance/source/acceptance_catalog.json` 由来の AC ID 順序を保ち、重複 ID を含まないことを検査し、提出 checklist の監査性と diff 可能性を高める。

## スコープ

- `tools/final-evidence-candidate.js` の checklist 検査に row order / unique ID gate を追加する。
- `tools/check-final-evidence-candidate-fixtures.js` に順序入れ替え fixture と重複 ID fixture を追加する。

## スコープ外

- Git tag/release の作成
- AWS deploy/publish
- CloudFormation capture
- final evidence manifest / final checklist の実作成または署名

## 受け入れ条件

- [ ] final checklist の AC ID 順序が source catalog と異なる場合、`acceptance:final-candidate:fixture:check` が失敗として検出する。
- [ ] final checklist に重複 ID が含まれる場合、`acceptance:final-candidate:fixture:check` が失敗として検出する。
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

1. checklist parse 後に row ID 配列を取得する。
2. 重複 ID がないことと、ID 順序が `acceptanceIds` と完全一致することを検査する。
3. ID swap / duplicate fixture を追加する。
4. targeted check と broad verification を実行する。

## ドキュメント保守方針

source catalog / schema の形式変更は行わない。final candidate validator の追加 gate として task / report / PR コメントに検査意図を残す。

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

- 最終 checklist を人手で編集した場合に行順が入れ替わると validator が拒否する。ただし source catalog と同じ順序を要求することでレビュー・差分確認・監査が容易になるため、検収提出物として妥当な制約と判断する。
