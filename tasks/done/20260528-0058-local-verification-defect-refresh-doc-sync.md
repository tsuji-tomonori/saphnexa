# local verification defect refresh doc sync

- 状態: done
- タスク種別: 修正
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

AC-153 の `defect-snapshot-refresh` は external action plan、final readiness、final acceptance runbook に追加済みである。一方、`docs/ops/local-verification.md` の `acceptance:external-actions:check` 説明は Git tag/release、AWS deploy/publish、CloudFormation capture、final checklist signoff のみを列挙しており、defect snapshot refresh を含んでいない。

## 問題文

2026-05-28 時点の PR branch で、local verification docs が最新の external action set と同期しておらず、GitHub issue tracker 再取得が最終検収外部作業であることを明示できていない。

## 軽量なぜなぜ / RCA

- 確認済み事実:
  - `tools/external-acceptance-actions.js` は `defect-snapshot-refresh` action を持つ。
  - `tools/final-acceptance-readiness.js` の `finalization_commands` は `gh issue list --state open --json number,title,labels,state` を含む。
  - `docs/ops/local-verification.md` の external action 説明には defect snapshot refresh が含まれていない。
  - `tools/check-docs.js` は local verification docs に command が含まれることは検査するが、defect refresh の記載は検査していない。
- 推定原因:
  - AC-153 gate を段階的に追加したため、local verification docs の説明と docs checker の観点が追随していなかった。
- 根本原因:
  - external action set と local verification docs の同期検査が command presence に偏り、action ID / issue tracker refresh の意味を検査していなかった。
- 影響範囲:
  - ローカル検証手順を読む operator が、GitHub issue tracker 再取得を最終検収外部作業として認識しにくい。
- 対策:
  - local verification docs に defect snapshot refresh と `gh issue list` の扱いを追記し、docs checker で記載を検査する。

## 目的

local verification docs と docs checker を AC-153 / defect snapshot refresh gate に同期し、未実施の外部確認をローカル完了扱いにしない導線を強める。

## スコープ

- `docs/ops/local-verification.md` の external action / defect list 記述を更新する。
- `tools/check-docs.js` に local verification docs の defect refresh 記載検査を追加する。

## スコープ外

- GitHub issue tracker の実再取得
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final signoff

## 受け入れ条件

- [x] local verification docs が `defect-snapshot-refresh` と `gh issue list --state open --json number,title,labels,state` を記載する。
- [x] local verification docs が GitHub issue tracker 再取得をローカル完了扱いにしないことを記載する。
- [x] docs checker が上記記載を検査する。
- [x] 外部 action は未実行 / pending のまま維持する。

## Done 条件

- [x] docs / checker を更新する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [x] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [x] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. `docs/ops/local-verification.md` の external action と defect list 記述を更新する。
2. `tools/check-docs.js` に required phrases を追加する。
3. docs/final/package/verify を実行する。
4. 作業レポート、commit / push、PR コメント、task done 更新を行う。

## ドキュメント保守方針

対象は local verification docs の同期修正であり、同じ作業範囲で docs を更新する。

## 検証計画

- `npm run docs:check`
- `npm run acceptance:external-actions:check`
- `npm run acceptance:final:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- pass: `npm run docs:check`
- pass: `npm run acceptance:external-actions:check`
- pass: `npm run acceptance:final:check`
- pass: `npm run verify`
- pass: `git diff --check`
- pass: `pre-commit run --files docs/ops/local-verification.md tools/check-docs.js tasks/do/20260528-0058-local-verification-defect-refresh-doc-sync.md reports/working/20260528-0058-local-verification-defect-refresh-doc-sync.md`

## 実施結果

- `docs/ops/local-verification.md` に `defect-snapshot-refresh` と `gh issue list --state open --json number,title,labels,state` を追記した。
- GitHub issue tracker の最終再取得をローカル snapshot だけでは完了扱いにしないことを明記した。
- `tools/check-docs.js` に defect refresh 関連 phrase の検査を追加した。
- 外部 action は実行せず、pending のまま維持した。

## PR セルフレビュー観点

- docs と実装の同期
- 変更範囲に見合うテスト
- RAG の根拠性・認可境界を弱めていないこと
- benchmark 期待語句・QA sample 固有値・dataset 固有分岐を実装へ入れていないこと

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4556220750
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4556222544

## リスク

- docs checker が日本語 phrase に依存する。外部 action set と local verification docs の同期を保つ目的の明示的な検査として許容する。
