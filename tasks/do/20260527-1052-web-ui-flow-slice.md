# web UI flow ローカル検収スライス

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-27 10:52 JST
- 対象 PR: #1

## 背景

検収 trace では chat/admin UI、role route、a11y、web performance、E2E が source または静的 gate に留まっており、ローカルで機械検証できる flow 証跡が不足している。

## 目的

ローカル API と web source を組み合わせ、chat/admin の主要 UI flow、route role、静的 a11y、bundle/perf report を再現可能な検証コマンドとして追加する。

## スコープ

- web flow / a11y / bundle report の検査スクリプトを追加する。
- package scripts、Taskfile、CI workflow、admin test report、docs、traceability を同期する。
- 実ブラウザ、CloudFront、Playwright、axe、Lighthouse CI はこのスライスでは実行しない。

## 実装前チェックリスト

- [x] 既存 web source と route metadata を確認する。
- [x] chat flow と admin flow を local API で検査する。
- [x] route role と admin artifact access policy を検査する。
- [x] 静的 a11y と no mock production UI の観点を検査する。
- [x] bundle/perf report を生成・検査する。
- [x] docs/trace/CI/admin report のコマンド一覧を同期する。
- [x] 関連検証と `npm run verify` を通す。
- [ ] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- `/chat` と `/admin` の主要 local flow が API 結果に基づいて検査される。
- chat UI source が質問入力、送信、イベント表示、空状態/disabled state を持つことを検査できる。
- admin UI source が評価実行、成果物一覧、admin 限定 artifact access を扱うことを検査できる。
- static a11y report が main/nav/section labels/button type/form label/link text/status 表示を検査し、violations 0 を出力する。
- bundle/perf report が web source gzip、route transition p95、対象 routes を出力する。
- `package.json`、`Taskfile.yml`、`.github/workflows/ci.yml`、`tools/build-admin-test-report.js`、`docs/ops/local-verification.md`、`docs/acceptance/traceability.md` が実装と同期している。
- 対象検証、docs/acceptance 検証、`npm run verify`、`git diff --check`、pre-commit が pass する。

## 受け入れ条件

- AC-050: `/chat`、`/admin`、admin docs/report path の role route と local access flow を検査できる。
- AC-052: chat UI の質問・送信・イベント表示 flow を local API と source gate で検査できる。
- AC-053: admin UI の評価実行・成果物一覧 flow を local API と source gate で検査できる。
- AC-054: static a11y report で主要 landmark/label/button/link/status を検査できる。
- AC-055: bundle/perf report で gzip size と route transition p95 を検査できる。
- AC-123: local E2E に加えて web flow smoke を CI 対象にできる。

## 検証計画

- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run web:bundle:check`
- `npm run web:perf:local`
- `npm run ui:check`
- `npm run ci:check`
- `npm run docs:check`
- `npm run acceptance:check`
- `npm run admin-artifacts:build`
- `npm run artifacts:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## ドキュメント保守方針

- local verification docs に新規 web 検証コマンドを追記する。
- traceability はローカル検証の根拠を反映し、実ブラウザ/CloudFront/Playwright/axe/Lighthouse は未実施として明記する。

## PR レビュー観点

- docs と実装の同期。
- 変更範囲に見合うテスト。
- UI に固定業務データ、架空ユーザー、demo fallback、未実装操作を混入していないこと。
- RAG の根拠性・認可境界を弱めていないこと。

## リスク・制約

- このスライスは実ブラウザではなく Node/local API/source gate によるローカル検証である。
- Playwright/axe/Lighthouse/CloudFront の実行証跡は後続または AWS/UAT 環境で必要。

## 実行した検証

- `npm run web:flow:check`: pass
- `npm run web:a11y:check`: pass
- `npm run web:bundle:check`: pass
- `npm run ui:check`: pass
- `npm run web:perf:local`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `npm run acceptance:check`: pass
- `npm run admin-artifacts:build`: pass
- `npm run artifacts:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files ...`: pass
