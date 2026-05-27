# final fixture command doc sync

状態: done

## 背景

直前の task で `npm run acceptance:final:fixture:check` を追加し、final readiness が final candidate ready 後に `final_acceptance_ready: true` へ遷移できる positive path を検査できるようにした。

一方で、`docs/ops/runbooks/final-acceptance.md`、`docs/ops/local-verification.md`、`tools/check-docs.js`、`.github/workflows/ci.yml`、`tools/check-ci-workflow.js`、`tools/build-admin-test-report.js` は、finalization / acceptance command inventory として新コマンドをまだ含んでいない。検収手順と CI/report の列挙が実際の `verify` / `finalization_commands` とずれると、最終検収時に positive-path fixture が実行されない可能性がある。

## 目的

`acceptance:final:fixture:check` を runbook、local verification docs、docs check、CI workflow check、admin test report inventory に同期し、final readiness positive path の検証が運用手順と CI/report からも抜けないようにする。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点で `acceptance:final:fixture:check` は `package.json` と final readiness command order に追加済みだが、runbook / local verification docs / docs check / CI workflow / admin test report の command inventory には未反映である。

### 確認済み事実

- `package.json` の `verify` は `npm run acceptance:final:fixture:check` を含む。
- `tools/final-acceptance-readiness.js` の `finalization_commands` は `npm run acceptance:final:fixture:check` を含む。
- `tools/check-final-acceptance-readiness.js` は finalization command order に `npm run acceptance:final:fixture:check` を含む。
- `docs/ops/runbooks/final-acceptance.md` の手順は `acceptance:final-candidate:fixture:check` の次に `acceptance:final-candidate:check` へ進んでいる。
- `docs/ops/local-verification.md` のコマンド一覧は `acceptance:final:fixture:check` を含まない。
- `tools/check-docs.js` の local verification required commands は `acceptance:final:fixture:check` を含まない。
- `.github/workflows/ci.yml` の `contract-generation-diff` job は `acceptance:final:fixture:check` を含まない。
- `tools/check-ci-workflow.js` と `tools/build-admin-test-report.js` も新コマンドを要求・列挙していない。

### 推定原因

- final readiness positive-path fixture は tool/verify を優先して追加され、docs/CI/report の command inventory 同期が後続作業として残った。
- acceptance command inventory が複数ファイルに分散しており、追加コマンドの同期漏れを検出する check がそのコマンド自体をまだ要求していなかった。

### 根本原因

- finalization command set の単一ソース化が不十分で、docs/CI/report が同じコマンド集合を手動で保持している。
- 新規 acceptance command 追加時に、運用手順・CI・report inventory への同期を強制する検査が不足していた。

### 影響範囲

- final acceptance runbook。
- local verification docs。
- docs check。
- CI workflow command coverage。
- admin Allure-compatible report manifest。
- AC-001 / AC-002 / AC-004 / AC-150 / AC-151 / AC-152 の finalization procedure。

### 対策

- final acceptance runbook の手順に `npm run acceptance:final:fixture:check` を追加する。
- local verification docs のコマンド一覧と説明に `npm run acceptance:final:fixture:check` を追加する。
- `tools/check-docs.js` と `tools/check-ci-workflow.js` に required command として追加する。
- `.github/workflows/ci.yml` の `contract-generation-diff` job に追加する。
- `tools/build-admin-test-report.js` の suites に追加し、admin test report inventory と CI workflow reference を同期する。

## スコープ

- 対象:
  - `docs/ops/runbooks/final-acceptance.md`
  - `docs/ops/local-verification.md`
  - `tools/check-docs.js`
  - `.github/workflows/ci.yml`
  - `tools/check-ci-workflow.js`
  - `tools/build-admin-test-report.js`
  - task/report
- 対象外:
  - final readiness logic の再変更
  - final evidence manifest/checklist/CloudFormation inventory 実ファイル作成
  - Git tag / GitHub Release / AWS deploy / signoff

## 実装計画

1. runbook と local verification docs に `acceptance:final:fixture:check` を追加する。
2. docs check / CI workflow check / admin test report inventory に required command を追加する。
3. CI workflow の acceptance job に新コマンドを追加する。
4. docs/check/verify を実行する。
5. 作業レポート、commit、push、PR コメントまで反映する。

## ドキュメント保守計画

- 今回の主対象は docs と docs/CI/report inventory の同期。
- finalization command order は既に tool 側で更新済みのため、docs がそれに追随していることを検査する。

## 受け入れ条件

- [x] final acceptance runbook が `npm run acceptance:final:fixture:check` を finalization 手順に含む。
- [x] local verification docs のコマンド一覧と説明が `npm run acceptance:final:fixture:check` を含む。
- [x] `tools/check-docs.js` が local verification docs に `npm run acceptance:final:fixture:check` があることを検査する。
- [x] `.github/workflows/ci.yml` の acceptance job が `npm run acceptance:final:fixture:check` を実行する。
- [x] `tools/check-ci-workflow.js` と `tools/build-admin-test-report.js` が新コマンドを要求・列挙する。
- [x] 外部状態を変更せず、final acceptance pending 状態を維持する。

## Done 条件

- [x] 実装差分が PR branch に commit / push されている。
- [x] 受け入れ条件確認コメントとセルフレビューコメントを PR に投稿している。
- [x] task md に PR コメント URL と検証結果を記録し、`tasks/done/` へ移動している。
- [x] 作業レポートを `reports/working/` に保存している。

## 検証計画

- `npm run docs:check`
- `npm run ci:check`
- `npm run admin-artifacts:build`
- `npm run artifacts:check`
- `npm run acceptance:final:fixture:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- `npm run docs:check`: pass
- `npm run ci:check`: pass
- `npm run acceptance:final:fixture:check`: pass
- `npm run admin-artifacts:build`: pass
- `npm run artifacts:check`: pass
- `npm run verify`: pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553550709
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553553625
- GitHub Apps comment は既知の 403 `Resource not accessible by integration` のため、`gh pr comment` fallback で投稿した。

## PR レビュー観点

- 新コマンドが runbook / local docs / docs check / CI / report inventory に同じ意味で同期されているか。
- final readiness positive path と local pending guard が混同されていないか。
- 外部状態変更が含まれていないか。

## リスク

- command inventory が複数ファイルに残っているため、今後も新コマンド追加時は docs/CI/report の同期確認が必要。
