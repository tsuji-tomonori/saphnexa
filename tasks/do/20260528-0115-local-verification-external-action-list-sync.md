# local verification external action list sync

- 状態: doing
- タスク種別: ドキュメント更新
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

`docs/ops/local-verification.md` はローカルでは完了扱いにしない外部作業を列挙している。AC-153 の `defect-snapshot-refresh` は既に外部 action として追加済みだが、外部 action plan 実行の要約行では release/deploy/publish/CloudFormation/final evidence/signoff だけを列挙している。

## 目的

local verification docs の未完了外部 action 一覧を最新の external action plan と同期し、defect snapshot refresh が外部 action plan 実行対象であることを明示する。

## スコープ

- `docs/ops/local-verification.md` の外部 action plan 実行一覧に `defect snapshot refresh` を追加する。
- `tools/check-docs.js` に同 phrase の検査を追加する。

## スコープ外

- GitHub issue tracker の実再取得
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final signoff

## 受け入れ条件

- [x] local verification docs の外部 action plan 実行一覧が defect snapshot refresh を含む。
- [x] docs checker が未完了一覧の defect snapshot refresh 記載を検査する。
- [x] 外部 action は未実行 / pending のまま維持する。

## Done 条件

- [x] docs / checker を更新する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [ ] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [ ] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. local verification docs の外部 action plan 実行一覧を更新する。
2. docs checker に同期 phrase を追加する。
3. docs check / verify を実行する。
4. 作業レポート、commit / push、PR コメント、task done 更新を行う。

## ドキュメント保守方針

対象は local verification docs の同期修正であり、同じ作業範囲で docs を更新する。

## 検証計画

- `npm run docs:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- pass: `npm run docs:check`
- pass: `npm run verify`
- pass: `git diff --check`
- pass: `pre-commit run --files docs/ops/local-verification.md tools/check-docs.js tasks/do/20260528-0115-local-verification-external-action-list-sync.md reports/working/20260528-0115-local-verification-external-action-list-sync.md`

## 実施結果

- `docs/ops/local-verification.md` の外部 action plan 実行一覧に `defect snapshot refresh` を追加した。
- `tools/check-docs.js` に未完了一覧の `CloudFormation capture、defect snapshot refresh、final evidence 作成` phrase 検査を追加した。
- 外部 action は実行せず、pending のまま維持した。

## PR セルフレビュー観点

- docs と実装の同期
- 変更範囲に見合うテスト
- RAG の根拠性・認可境界を弱めていないこと
- benchmark 期待語句・QA sample 固有値・dataset 固有分岐を実装へ入れていないこと

## リスク

- docs checker が特定 phrase に依存する。local verification docs と external action set の同期漏れを検出するための明示検査として許容する。
