# final candidate status consistency gate

- 状態: done
- タスク種別: 機能追加
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

final readiness builder は `finalCandidateStatus.ready === true` を final candidate ready の主判定にしている。通常は `tools/check-final-evidence-candidate.js` が `ready`、`status`、`missing_files`、`errors` を整合した状態で生成するが、aggregate readiness gate としては、矛盾した status object を ready 扱いしない防御がある方が安全である。

## 目的

final candidate status が `ready=true` でも、`status=ready`、`missing_files=[]`、`errors=[]` と整合していない場合は final acceptance ready にしない。

## スコープ

- `tools/final-acceptance-readiness.js` に final candidate status 整合判定 helper を追加する。
- `tools/check-final-acceptance-readiness-fixtures.js` に `ready=true` だが `status=invalid` / `errors` ありの fixture を追加する。

## スコープ外

- final evidence manifest / final checklist の実作成または署名
- Git tag/release の作成
- AWS deploy/publish
- CloudFormation capture

## 受け入れ条件

- [x] final readiness builder は `ready=true` だけでは final candidate ready 扱いしない。
- [x] `status !== "ready"`、`missing_files` 非空、または `errors` 非空の final candidate status は final readiness を ready にしない。
- [x] 矛盾した final candidate status fixture が `final_acceptance_ready=false` になる。
- [x] 既存の ready fixture は引き続き ready になる。
- [x] final acceptance の外部残件を完了扱いしない。
- [x] 変更範囲に見合う検証を実行し、結果を task / report / PR コメントに残す。

## Done 条件

- [x] 実装と fixture を追加する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [x] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [x] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. `isFinalCandidateReady` helper で `ready=true`、`status=ready`、`missing_files=[]`、`errors=[]` を同時確認する。
2. readiness output の `final_candidate_gate.ready` も helper の判定値に合わせる。
3. 矛盾 status fixture を追加し、aggregate readiness が ready にならないことを検証する。

## ドキュメント保守方針

final runbook の手順は既に `acceptance:final-candidate:check` と `acceptance:final:check` を要求しているため、docs 本文更新は不要。実装差分、task、report、PR コメントに gate 強化内容を記録する。

## 検証計画

- `npm run acceptance:final:fixture:check`
- `npm run acceptance:final:check`
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

- 通常の generator 出力は元々整合しているため、実運用挙動は変わらない。防御的な aggregate gate 強化として扱う。

## 実施結果

- 実装 commit: `01d570f`
- 作業レポート: `reports/working/20260527-2255-final-candidate-status-consistency-gate.md`
- PR 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4555185235
- PR セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4555188521

## 検証結果

- `npm run acceptance:final:fixture:check`: pass
- `npm run acceptance:final:check`: pass（current readiness は final acceptance not ready）
- `npm run acceptance:package:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files tools/final-acceptance-readiness.js tools/check-final-acceptance-readiness-fixtures.js tasks/do/20260527-2253-final-candidate-status-consistency-gate.md`: pass
- `pre-commit run --files reports/working/20260527-2255-final-candidate-status-consistency-gate.md`: pass

## 残件

- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence manifest / checklist の最終作成・署名は未実施。
- `dist/acceptance/final_readiness.json` は `final_acceptance_ready: false` のまま扱う。
