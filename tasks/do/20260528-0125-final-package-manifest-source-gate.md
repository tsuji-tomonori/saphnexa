# final package manifest source gate

- 状態: doing
- タスク種別: 検収 package gate 修正
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

final readiness は実証跡が揃った場合に ready へ遷移できるようになった。一方、`acceptance:package:build` は常に `dist/acceptance/evidence_manifest.draft.json` を主 manifest として生成し、final-ready 時も draft/pending 値を含む manifest を package checker が許容し得る。

## 目的

final-ready 時の acceptance package が `docs/acceptance/final/evidence_manifest.json` 由来の final manifest を `dist/acceptance/evidence_manifest.json` として扱い、local preflight では従来通り draft manifest を使うようにする。

## スコープ

- acceptance package builder の manifest 出力パスを ready / pending state で分岐する。
- acceptance package summary に実際に検査すべき manifest path を記録する。
- acceptance package checker が final-ready 時に draft marker / pending final evidence を許容しない。
- local preflight の draft package は現状通り pass させる。

## スコープ外

- final evidence manifest 実ファイルの作成
- GitHub issue tracker 再取得
- Git tag/release、AWS deploy/publish、CloudFormation capture、final signoff の実行

## 受け入れ条件

- [x] final-ready 時の package summary が `dist/acceptance/evidence_manifest.json` を主 manifest path として記録する。
- [x] final-ready 時の package checker が draft marker / pending final evidence を持つ manifest を final manifest として許容しない。
- [x] 現在の local preflight では `dist/acceptance/evidence_manifest.draft.json` を使い、pending のまま pass する。
- [x] 外部 action は未実行 / pending のまま維持する。

## Done 条件

- [x] builder / checker / 必要な docs を更新する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [ ] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [ ] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. `tools/build-acceptance-package.js` で final-ready 時に final manifest を dist へ出力し、summary に path を記録する。
2. `tools/check-acceptance-package.js` で summary の manifest path を読み、draft / final の検査を分岐する。
3. final acceptance runbook に package manifest path の違いを追記する。
4. acceptance package / final / verify を実行する。

## 検証計画

- `npm run acceptance:final:fixture:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run docs:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- pass: `npm run acceptance:package:check`
- pass: `npm run acceptance:final:check`
- pass: `npm run docs:check`
- pass: `npm run verify`

## 実施結果

- final-ready 時は `docs/acceptance/final/evidence_manifest.json` を `dist/acceptance/evidence_manifest.json` として出力し、summary の `evidence_manifest_path` に記録するようにした。
- local preflight では `dist/acceptance/evidence_manifest.draft.json` を維持する。
- package checker が final manifest に `draft_status` / `pending_final_evidence` を許容しないようにした。
- 外部 action は実行せず、現在の package は draft/pending のまま維持した。

## PR セルフレビュー観点

- docs と実装の同期
- 変更範囲に見合うテスト
- RAG の根拠性・認可境界を弱めていないこと
- benchmark 期待語句・QA sample 固有値・dataset 固有分岐を実装へ入れていないこと

## リスク

- final-ready branch は実 final evidence ファイルがない現在の local preflight では実ファイルで検査できない。fixture と checker 分岐で、draft marker を final として許容しない条件を明示する。
