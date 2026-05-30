# TypeScript source-of-truth と atomic coverage gate

## 背景

`.workspace/plam-20260530-01.txt` では、API / Tools API / Agent / Workers / Web を TypeScript source-of-truth と atomic module 構成へ移行し、operation coverage を機械的に検査できる状態にすることが求められている。

## 目的

手書き source の JS mirror、API / Tools API の implementation coverage、atomicity / static analysis の検査を CI で扱える形へ進める。

## タスク種別

機能追加

## スコープ

- `check:no-src-js` を追加し、`apps/**/src` と `packages/**/src` の手書き JS を検出できるようにする。
- `api:implementation:check` を追加し、`packages/api-contract` の全 operation について coverage metadata を検査できるようにする。
- `tools:implementation:check` を追加し、`packages/tool-contract` の全 tool について coverage metadata を検査できるようにする。
- `check:atomicity` を追加し、計画ファイルの atomicity rule のうち静的に確認できる境界を検査できるようにする。
- `check:static` / `verify` に新しい gate を組み込む。
- 必要な docs / reports を更新する。

## スコープ外

- AWS dev/UAT deploy。
- Aurora DSQL 実 cluster への Flyway 適用。
- Bedrock KB / AgentCore / AppSync Events の実疎通。
- 全 40 API と 6 Tools の本番業務実装をこの 1 turn で完成させたと偽ること。

## 実施計画

1. 現行の API / Tools / Agent / Workers / Web / package scripts を調査する。
2. coverage manifest の source-of-truth となる metadata と検査スクリプトを追加する。
3. no-src-js / atomicity / implementation coverage gate を package scripts と Taskfile に接続する。
4. 必要な docs と作業レポートを追加する。
5. 変更範囲に見合う検証を実行し、失敗時は修正して再実行する。
6. commit / push / PR 作成 / 受け入れ条件コメント / セルフレビューまで行う。

## ドキュメント保守方針

新しい検証コマンドは開発者・CI 向けの挙動変更なので、既存 docs に関連箇所があるか確認する。恒久 docs への追記が必要な場合は最小範囲で更新し、不要な場合は作業レポートに理由を残す。

## 受け入れ条件

- [x] AC1: `npm run check:no-src-js` が定義され、手書き source JS を検出できる。
- [x] AC2: `npm run api:implementation:check` が定義され、40 公開 API の route/schema/usecase/local/prod coverage を検査できる。
- [x] AC3: `npm run tools:implementation:check` が定義され、6 Tools の route/schema/usecase/policy/audit/timeout coverage を検査できる。
- [x] AC4: `npm run check:atomicity` が定義され、route/repository/schema/UI/Agent 境界の静的検査を実行できる。
- [x] AC5: `npm run check:static` と `npm run verify` に新しい gate が含まれる。
- [x] AC6: 変更範囲に見合う検証を実行し、未実施項目は理由を記録する。
- [x] AC7: PR 作成後に受け入れ条件確認コメントとセルフレビューコメントを日本語で投稿する。

## 検証計画

- `npm run check:no-src-js`
- `npm run api:implementation:check`
- `npm run tools:implementation:check`
- `npm run check:atomicity`
- `npm run check:static`
- `git diff --check`

## PR レビュー観点

- 未実装 operation を実装済みと誤表示していないこと。
- production-ready gate と development coverage report の区別が明確であること。
- RAG の根拠性・認可境界を弱めていないこと。
- benchmark 期待語句や dataset 固有分岐を実装に入れていないこと。
- docs と scripts の同期が取れていること。

## リスク

- 計画ファイルの最終スコープは非常に広く、今回の PR はその土台となる gate 実装に集中する。
- 既存 source JS が多い場合、`check:no-src-js` を verify に入れると既存負債が顕在化する。例外扱いは明示的に定義し、実装済み扱いにしない。

## 状態

done
