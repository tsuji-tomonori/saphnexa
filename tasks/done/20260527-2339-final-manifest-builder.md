# final evidence manifest builder

- 状態: done
- タスク種別: 機能追加
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

AC-001/AC-002 は Git tag/release、CloudFormation stack、DB migration、Allure/docs/RAG/cost の最終証跡を `docs/acceptance/final/evidence_manifest.json` として提出することを求める。現在の runbook は evidence manifest を手作業で作成する手順を示しているが、current Git commit、package version、CloudFormation inventory の stack id/name/account/region と整合した manifest を生成する tool がない。

## 目的

final evidence manifest input JSON と final CloudFormation inventory から `docs/acceptance/final/evidence_manifest.json` を生成する builder と fixture check を追加し、手作業による manifest 不整合を防ぐ。

## スコープ

- final evidence manifest input JSON と final CloudFormation inventory から manifest を生成する module / CLI を追加する。
- builder の positive path と invalid input を検査する fixture check を追加する。
- fixture check で checklist / CloudFormation inventory / manifest を組み合わせ、final candidate validator の ready path まで確認する。
- npm script、final acceptance runbook、local verification docs、docs check を同期する。
- `npm run verify` に fixture check を組み込む。

## スコープ外

- Git tag/release の作成
- AWS deploy/publish、CloudFormation capture
- `docs/acceptance/final/evidence_manifest.json` の実 final 証跡作成
- final checklist の実署名

## 受け入れ条件

- [x] builder は current Git commit と `package.json` version を manifest に反映する。
- [x] builder は CloudFormation inventory の stack name/id/account/region と manifest の `aws_account_id` / `cloudformation_stacks` を整合させる。
- [x] builder は Git tag/release、DB migration、Allure/docs/RAG/cost を input から反映する。
- [x] fixture check が manifest / checklist / CloudFormation inventory の組み合わせで final candidate ready path を検査する。
- [x] invalid input fixture が不足 field または AWS account mismatch を拒否する。
- [x] AC-001/002 の外部 Git release / AWS publish を完了扱いしない。
- [x] 変更範囲に見合う検証を実行し、結果を task / report / PR コメントに残す。

## Done 条件

- [x] builder module / CLI / fixture check / npm script / docs を追加する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [x] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [x] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. `tools/final-evidence-manifest.js` に input + CloudFormation inventory から manifest を生成する処理を追加する。
2. `tools/build-final-evidence-manifest.js` に CLI wrapper を追加する。
3. `tools/check-final-evidence-manifest-fixtures.js` を追加し、positive path / invalid input / final candidate ready path を検査する。
4. `package.json`、`docs/ops/runbooks/final-acceptance.md`、`docs/ops/local-verification.md`、`tools/check-docs.js` を同期する。

## ドキュメント保守方針

運用手順に関わるため `docs/ops/runbooks/final-acceptance.md` に manifest input と build command を追加する。ローカルで検査できる fixture command は `docs/ops/local-verification.md` にも追記する。

## 検証計画

- `npm run acceptance:final-manifest:fixture:check`
- `npm run acceptance:final-checklist:fixture:check`
- `npm run acceptance:final-candidate:fixture:check`
- `npm run docs:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- pass: `npm run acceptance:final-manifest:fixture:check`
- pass: `npm run docs:check`
- pass: `npm run acceptance:final-candidate:fixture:check`
- pass: `npm run acceptance:final-checklist:fixture:check`
- pass: `npm run acceptance:final:check`
- pass: `npm run acceptance:package:check`
- pass: `npm run verify`
- pass: `git diff --check`
- pass: `pre-commit run --files package.json docs/ops/runbooks/final-acceptance.md docs/ops/local-verification.md tools/check-docs.js tools/final-evidence-manifest.js tools/build-final-evidence-manifest.js tools/check-final-evidence-manifest-fixtures.js tasks/do/20260527-2339-final-manifest-builder.md reports/working/20260527-2347-final-manifest-builder.md`

## 実施結果

- `tools/final-evidence-manifest.js` に final manifest builder を追加し、input と CloudFormation inventory の account/region/stack 整合、final text、cost 上限、checksum status を検査するようにした。
- `tools/build-final-evidence-manifest.js` に CLI を追加し、`--input`、`--cloudformation-inventory`、`--output` を指定可能にした。
- `tools/check-final-evidence-manifest-fixtures.js` を追加し、manifest / checklist / CloudFormation inventory の組み合わせで final candidate ready path を確認した。
- `package.json`、`docs/ops/runbooks/final-acceptance.md`、`docs/ops/local-verification.md`、`tools/check-docs.js` を同期した。
- 実 final 証跡ファイル、Git release、AWS publish、CloudFormation capture は外部状態変更を伴うため、この task では完了扱いにしていない。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4555659698
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4555661732

## PR セルフレビュー観点

- docs と実装の同期
- 変更範囲に見合うテスト
- RAG の根拠性・認可境界を弱めていないこと
- benchmark 期待語句・QA sample 固有値・dataset 固有分岐を実装へ入れていないこと

## リスク

- Git tag/release と AWS publish は外部状態変更のため、この builder では実行しない。生成後の最終妥当性は既存の `npm run acceptance:final-candidate:check` で検査する。
