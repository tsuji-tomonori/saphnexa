# AWS dev/UAT capture helper 実体追加

状態: done

## 背景

AWS dev/UAT raw capture plan は `edge-realtime`、`rag-runtime`、`published-artifacts` の取得 command として `node tools/capture-*.js` を listed している。しかし現状では helper script 本体が存在せず、AWS credentials と実環境が用意された後に operator が raw output を取得する段階で詰まる。

## 目的

raw capture plan が参照する helper script を repo 内に実体化し、plan checker で helper file の存在も検査する。これにより、AWS dev/UAT 7 の raw output 取得手順をより実行可能な状態へ近づける。

## タスク種別

機能追加

## スコープ

- `tools/capture-edge-realtime-smoke.js` を追加する。
- `tools/capture-rag-runtime-smoke.js` を追加する。
- `tools/capture-admin-artifacts-smoke.js` を追加する。
- helper の共通ユーティリティを追加する。
- raw capture plan checker に `node tools/*.js` helper 実体確認を追加する。
- docs / local verification を同期する。
- 実 AWS への HTTP/API 実行、deploy、migration、publish、E2E、性能、RAG品質評価は実行しない。

## 実施計画

1. helper が必要とする env / args を定義する。
2. helper scripts と共通ユーティリティを実装する。
3. raw capture plan checker に helper file existence check を追加する。
4. docs を同期する。
5. targeted checks と `npm run verify` を実行する。
6. report、commit/push、PR コメント、task done まで進める。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に helper の env 前提と出力用途を追記する。
- `docs/ops/local-verification.md` に helper 実体確認の位置づけを追記する。

## 受け入れ条件

- [x] raw capture plan が参照する 3 helper script が存在する。
- [x] helper script は必要な env がない場合に fail し、架空値や demo fallback を出さない。
- [x] raw capture plan checker が helper file existence を検査する。
- [x] docs が helper 前提と同期している。
- [x] `git diff --check`、targeted checks、`npm run verify` が pass する。
- [x] PR に受け入れ条件確認とセルフレビューコメントを追加できる。

## 検証計画

- `node tools/capture-edge-realtime-smoke.js --help`
- `node tools/capture-rag-runtime-smoke.js --help`
- `node tools/capture-admin-artifacts-smoke.js --help`
- missing env の expected fail 確認
- `npm run aws:dev-uat:raw-capture-plan:check`
- `npm run docs:check`
- `git diff --check`
- `npm run verify`

## PR レビュー観点

- helper が sample や mock を成功扱いで出さないこと。
- plan checker が missing helper を検出できること。
- 実 AWS 操作を自動実行していないこと。

## リスク

- helper は実環境 URL / ARN / ID を env で受け取って raw smoke を行うため、AWS credentials と実環境値がない状態では実行成功しない。
- 実 AWS raw output の取得は引き続き未実施である。

## 完了記録

- PR: https://github.com/tsuji-tomonori/saphnexa/pull/2
- 実装 commit: `d5ca542`
- 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4560711744
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4560713707
- 作業レポート: `reports/working/20260528-1246-aws-dev-uat-capture-helpers.md`
- 検証:
  - `node tools/capture-edge-realtime-smoke.js --help`: pass
  - `node tools/capture-rag-runtime-smoke.js --help`: pass
  - `node tools/capture-admin-artifacts-smoke.js --help`: pass
  - `npm run aws:dev-uat:capture-helpers:check`: pass
  - `npm run aws:dev-uat:raw-capture-plan:check`: pass
  - `npm run ci:check`: pass
  - `npm run acceptance:external-actions:check`: pass
  - `npm run docs:check`: pass
  - `git diff --check`: pass
  - `npm run verify`: pass
- 未実施:
  - 実 AWS dev/UAT deploy / migration / publish / E2E / 性能 / RAG品質評価は AWS credentials と実 raw output がないため未実施。
  - helper の実 HTTP probe は実環境 URL / ARN / ID / signed cookie env が未設定のため未実施。
  - `aws sts get-caller-identity --output json`: credentials 未設定で fail。
