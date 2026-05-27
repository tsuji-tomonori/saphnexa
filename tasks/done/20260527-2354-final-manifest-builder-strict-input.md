# final evidence manifest builder strict input

- 状態: done
- タスク種別: 修正
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

`tools/final-evidence-manifest.js` は final evidence manifest を生成する builder として追加したが、入力検査は必須値、禁止 marker、AWS account / CloudFormation stack 整合を中心にしている。一方、既存の final candidate validator と evidence manifest schema は、GitHub release URL と tag の一致、Allure/docs/RAG artifact path、cost assumption の利用量根拠をより厳密に検査している。

## 問題文

2026-05-27 時点の PR branch で、manifest builder は final candidate validator より緩い input を受け付け、生成後に `npm run acceptance:final-candidate:check` で初めて不整合が検出され得る。

## 軽量なぜなぜ / RCA

- 確認済み事実:
  - `tools/final-evidence-manifest.js` は `github_release_url` が非空かつ禁止 marker を含まないことは検査する。
  - `tools/final-evidence-manifest.js` は test/docs/RAG URL の artifact path 契約や、GitHub release URL が `git_tag` と一致することを検査していない。
  - `tools/final-evidence-candidate.js` と `docs/acceptance/evidence/evidence_manifest.schema.json` はこれらの契約を検査している。
- 推定原因:
  - builder 実装時に「生成物は final candidate validator で検査される」前提に寄せ、生成前 input validation と final gate の検査粒度を揃えていなかった。
- 根本原因:
  - final manifest 作成の入口である builder と、最終 gate の validation 契約が共通の検査観点として task に明示されていなかった。
- 影響範囲:
  - 実 final 証跡作成時に、間違った release URL や artifact path を含む manifest を一度生成できてしまい、後段 check まで修正点が分からない。
- 対策:
  - builder 側にも final gate と同等の主要 input validation を追加し、fixture で release URL/tag mismatch、Allure/docs/RAG path mismatch、cost usage basis mismatch を拒否する。

## 目的

final evidence manifest builder が、生成前に final candidate と同じ主要契約を拒否できるようにし、最終証跡作成時の不整合を早期に検出する。

## スコープ

- manifest builder の input validation を強化する。
- fixture check に builder 固有の invalid input ケースを追加する。
- docs 更新が必要か確認し、必要な場合のみ同期する。

## スコープ外

- Git tag/release の作成
- AWS deploy/publish、CloudFormation capture
- final evidence manifest / final checklist の実作成
- final candidate validator の仕様変更

## 受け入れ条件

- [x] builder が `github_release_url` と `git_tag` の mismatch を拒否する。
- [x] builder が Allure latest / Allure run report path 以外の test report URL を拒否する。
- [x] builder が admin docs / docs-site path 以外の docs URL を拒否する。
- [x] builder が evaluation run id と一致しない RAG evaluation report URL を拒否する。
- [x] builder が 50 DAU と 10 questions/user/day を含まない cost assumption を拒否する。
- [x] positive fixture は final candidate ready path まで通る。
- [x] 外部 Git release / AWS publish / final signoff は完了扱いしない。

## Done 条件

- [x] builder validation と fixture を更新する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [x] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [x] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. `tools/final-evidence-manifest.js` に release URL/tag、artifact URL path、RAG report path、cost usage basis の検査を追加する。
2. `tools/check-final-evidence-manifest-fixtures.js` に invalid input fixture を追加する。
3. 対象 check から `npm run verify` まで実行する。
4. 作業レポート、commit / push、PR コメント、task done 更新を行う。

## ドキュメント保守方針

final acceptance runbook は既に builder 実行手順を示している。今回の変更は builder の入力拒否条件強化であり、既存 schema と validator の契約に寄せるものなので、docs 変更は原則不要。検証後に必要性を再確認する。

## 検証計画

- `npm run acceptance:final-manifest:fixture:check`
- `npm run acceptance:final-candidate:fixture:check`
- `npm run docs:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- pass: `npm run acceptance:final-manifest:fixture:check`
- pass: `npm run acceptance:final-candidate:fixture:check`
- pass: `npm run docs:check`
- pass: `npm run acceptance:final:check`
- pass: `npm run acceptance:package:check`
- pass: `npm run verify`
- pass: `git diff --check`
- pass: `pre-commit run --files tools/final-evidence-manifest.js tools/check-final-evidence-manifest-fixtures.js tasks/do/20260527-2354-final-manifest-builder-strict-input.md reports/working/20260527-2357-final-manifest-builder-strict-input.md`

## 実施結果

- `tools/final-evidence-manifest.js` に release URL/tag、artifact URL、Allure/docs/RAG path、cost usage basis の入力検査を追加した。
- `tools/check-final-evidence-manifest-fixtures.js` に builder 固有の invalid input fixture を追加した。
- docs は既存 schema / final candidate validator の契約に builder を合わせる変更であり、追加更新不要と判断した。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final signoff は未実施のまま維持した。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4555749203
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4555751415

## PR セルフレビュー観点

- docs と実装の同期
- 変更範囲に見合うテスト
- RAG の根拠性・認可境界を弱めていないこと
- benchmark 期待語句・QA sample 固有値・dataset 固有分岐を実装へ入れていないこと

## リスク

- builder validation が厳しくなるため、既に手元で作った input JSON がある場合は生成前に fail する可能性がある。ただし final candidate gate と同じ契約へ早期に寄せるため、検収品質上は望ましい。
