# admin artifact generated_at freshness

- 状態: doing
- タスク種別: 修正
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

acceptance 系の生成物は current JST timestamp を出力し、checker で freshness を検査するようになった。一方、検収証跡に含まれる RAG 品質レポート、offline artifact inventory、admin docs / test report manifest は `2026-05-27T00:00:00.000Z` 固定の `generated_at` を出力している。

## 問題文

2026-05-28 時点の PR branch で、admin/RAG/offline 系のローカル検収生成物が、実行時刻ではなく固定日時の `generated_at` を証跡として出力する。

## 軽量なぜなぜ / RCA

- 確認済み事実:
  - `tools/check-rag-quality.js` は `dist/reports/rag-quality-local.json` に固定 `generated_at` を出力している。
  - `tools/check-offline-artifacts.js` は `dist/offline-artifacts/local/manifest.json` に固定 `generated_at` を出力している。
  - `tools/build-admin-docs.js` と `tools/build-admin-test-report.js` は admin artifact manifest に固定 `generated_at` を出力している。
  - `tools/check-admin-artifacts.js` は checksum や access control を検査するが、manifest freshness は検査していない。
- 推定原因:
  - 初期実装で deterministic output を優先し、検収証跡としての生成時刻 freshness を検査対象にしていなかった。
- 根本原因:
  - admin/RAG/offline artifact 生成処理が、既存の current JST timestamp helper と freshness check helper を利用していない。
- 影響範囲:
  - local verified として参照される RAG/admin/offline 証跡が、いつ生成されたかを誤って示す可能性がある。
- 対策:
  - 実生成物の `generated_at` を current JST timestamp にし、対応する check で当日 JST 生成を検査する。

## 目的

admin/RAG/offline 系のローカル検収生成物が、実行時点の JST timestamp を記録し、stale 固定日時を検収証跡として残さないようにする。

## スコープ

- `tools/check-rag-quality.js` の report `generated_at` を current JST timestamp にする。
- `tools/check-offline-artifacts.js` の manifest `generated_at` を current JST timestamp にする。
- `tools/build-admin-docs.js` の artifact `generated_at` を current JST timestamp にする。
- `tools/build-admin-test-report.js` の manifest `generated_at` を current JST timestamp にする。
- `tools/check-admin-artifacts.js`、RAG/offline check に freshness 検査を追加する。

## スコープ外

- fixture の固定日時変更
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final signoff

## 受け入れ条件

- [x] RAG 品質レポートの `generated_at` が実行日 JST の timestamp になる。
- [x] offline artifact manifest の `generated_at` が実行日 JST の timestamp になる。
- [x] admin docs artifact manifest の `generated_at` が実行日 JST の timestamp になる。
- [x] admin test report manifest の `generated_at` が実行日 JST の timestamp になる。
- [x] checker が上記 freshness を検査する。
- [x] 外部 action は未実行 / pending のまま維持する。

## Done 条件

- [x] generator / checker を更新する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [ ] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [ ] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. admin/RAG/offline の生成処理を `currentJstTimestamp()` 利用へ変更する。
2. admin/RAG/offline の checker に `isCurrentJstTimestamp()` 検査を追加する。
3. 対象 npm scripts と `npm run verify` を実行する。
4. 作業レポート、commit / push、PR コメント、task done 更新を行う。

## ドキュメント保守方針

ユーザー向け手順は変更しない。生成物の freshness の実装・検査強化であり、docs 変更は原則不要。

## 検証計画

- `npm run rag:quality:check`
- `npm run offline-artifacts:check`
- `npm run admin-artifacts:build`
- `npm run artifacts:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- pass: `npm run rag:quality:check`
- pass: `npm run offline-artifacts:check`
- pass: `npm run admin-artifacts:build`
- pass: `npm run artifacts:check`
- pass: `npm run verify`
- pass: `git diff --check`
- pass: `pre-commit run --files tools/check-rag-quality.js tools/check-offline-artifacts.js tools/build-admin-docs.js tools/build-admin-test-report.js tools/check-admin-artifacts.js tasks/do/20260528-0033-admin-artifact-generated-at-freshness.md`

## 実施結果

- `dist/reports/rag-quality-local.json` の `generated_at` を current JST timestamp にし、生成時に freshness を検査するようにした。
- `dist/offline-artifacts/local/manifest.json` の `generated_at` を current JST timestamp にし、manifest check で freshness を検査するようにした。
- admin docs / test report の artifact manifest `generated_at` を current JST timestamp にし、`artifacts:check` で freshness を検査するようにした。
- 外部 action は実行せず、pending のまま維持した。

## PR セルフレビュー観点

- docs と実装の同期
- 変更範囲に見合うテスト
- RAG の根拠性・認可境界を弱めていないこと
- benchmark 期待語句・QA sample 固有値・dataset 固有分岐を実装へ入れていないこと

## リスク

- 生成物の timestamp が実行ごとに変わる。`dist/` は検収用の生成出力であり、生成 + check 導線で当日 JST freshness を保証する。
