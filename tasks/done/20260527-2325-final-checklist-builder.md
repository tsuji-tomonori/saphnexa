# final acceptance checklist builder

- 状態: done
- タスク種別: 機能追加
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

AC-004 は最終検収 checklist の署名・AWS 証跡確認を求める。現在の final acceptance runbook は `docs/acceptance/final/acceptance_checklist.csv` を手作業で作成する手順を示しているが、source checklist の列順、全 AC 行、ID 順、source catalog との一致を維持しながら final CSV を作る tool がない。

## 目的

source catalog と signoff input JSON から final acceptance checklist CSV を生成する builder と fixture check を追加し、手作業による列順・ID・source text のずれを防ぐ。

## スコープ

- final checklist signoff input JSON から `docs/acceptance/final/acceptance_checklist.csv` 形式を生成する module / CLI を追加する。
- builder の positive path と invalid input を検査する fixture check を追加する。
- npm script、final acceptance runbook、local verification docs、docs check を同期する。
- `npm run verify` に fixture check を組み込む。

## スコープ外

- 実際の検収者署名
- `docs/acceptance/final/acceptance_checklist.csv` の実 final 証跡作成
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence manifest の最終作成

## 受け入れ条件

- [x] builder は source catalog の全 AC ID を source order で出力する。
- [x] builder は source checklist columns と同じ列を出力する。
- [x] builder は全行 `結果=PASS`、証跡リンク、確認者、確認日、備考を signoff input から設定する。
- [x] fixture check が positive path と invalid input を検査する。
- [x] runbook / local verification docs が builder command と signoff input path を示す。
- [x] AC-004 の検収者署名を完了扱いしない。
- [x] 変更範囲に見合う検証を実行し、結果を task / report / PR コメントに残す。

## Done 条件

- [x] builder module / CLI / fixture check / npm script / docs を追加する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [x] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [x] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. `tools/final-acceptance-checklist.js` に signoff input から checklist rows / CSV を生成する処理を追加する。
2. `tools/build-final-acceptance-checklist.js` に CLI wrapper を追加する。
3. `tools/check-final-acceptance-checklist-fixtures.js` を追加し、source order / columns / invalid input を検査する。
4. `package.json`、`docs/ops/runbooks/final-acceptance.md`、`docs/ops/local-verification.md`、`tools/check-docs.js` を同期する。

## ドキュメント保守方針

運用手順に関わるため `docs/ops/runbooks/final-acceptance.md` に signoff input と build command を追加する。ローカルで検査できる fixture command は `docs/ops/local-verification.md` にも追記する。

## 検証計画

- `npm run acceptance:final-checklist:fixture:check`
- `npm run docs:check`
- `npm run acceptance:final-candidate:fixture:check`
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

- signoff input の証跡 URL が最終 manifest artifact location と整合しない場合、既存の `npm run acceptance:final-candidate:check` で invalid になる。builder は CSV 生成支援に限定し、最終妥当性は final candidate validator に委ねる。

## 実施結果

- 実装 commit: `e5f1295`
- 作業レポート: `reports/working/20260527-2330-final-checklist-builder.md`
- PR 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4555523229
- PR セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4555527078

## 検証結果

- `npm run acceptance:final-checklist:fixture:check`: pass
- `npm run docs:check`: pass
- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final:check`: pass（current readiness は final acceptance not ready）
- `npm run acceptance:package:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files package.json docs/ops/runbooks/final-acceptance.md docs/ops/local-verification.md tools/check-docs.js tools/final-acceptance-checklist.js tools/build-final-acceptance-checklist.js tools/check-final-acceptance-checklist-fixtures.js tasks/do/20260527-2325-final-checklist-builder.md reports/working/20260527-2330-final-checklist-builder.md`: pass

## 残件

- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence manifest / checklist の最終作成・署名は未実施。
