# API client full route coverage

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-29 11:02 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` は、Zod/OpenAPI 生成型と frontend/backend 共有型をさらに進める必要があるとしている。直前の API client route helper slice では Web で使う主要 route の helper 化まで進めたが、全 38 public API route の helper 網羅は未完了として残している。

## 目的

`@saphnexa/api-client` の route helper を `packages/api-contract` の `publicApiRoutes` 全 operation に広げ、frontend client が API contract の operation/path と同期していることを source gate で検証できる状態へ進める。

## スコープ

- `packages/api-client/src/client.ts` に全 38 public API operation の route helper を追加する。
- path parameter を持つ route は helper 引数から encode された viewer path を生成する。
- `tools/check-type-surface.js` で API client helper の operation 網羅と path 同期を `publicApiRoutes` から検証する。
- `docs/ops/local-verification.md` に full route coverage gate の意味を追記する。
- OpenAPI からの完全な request/response 型生成や実 HTTP 通信の置換は別 slice とし、完了扱いにしない。

## 実装計画

1. 既存の `apiRoutes` を全 operation helper へ拡張する。
2. `ApiClientRouteName` / `ApiClientPath` の型制約を維持しつつ、path parameter helper を追加する。
3. source gate を `publicApiRoutes` ベースの全 operation/path 検査に強化する。
4. 関連 docs と作業レポートを更新し、targeted validation を実行する。

## ドキュメント保守方針

実 API contract の route 定義自体は変えない。検証境界が「主要 route」から「全 route helper coverage」へ広がるため、`docs/ops/local-verification.md` の type surface 説明を最小更新する。

## 受け入れ条件

- [x] `@saphnexa/api-client` が `publicApiRoutes` 全 38 operation の route helper を export する。
- [x] path parameter を持つ helper が `encodeURIComponent` を使って viewer path を生成する。
- [x] source gate が API client helper の operation 網羅と viewer path 同期を `publicApiRoutes` から検証する。
- [x] 既存 Web 呼び出しは helper 経由のまま動作する。
- [x] OpenAPI からの完全 generated client や request/response 型生成を完了扱いにしない。

## 検証計画

- `npm run typecheck`
- `npm run typecheck:source`
- `npm run typecheck -w @saphnexa/api-client`
- `npm run typecheck -w @saphnexa/web`
- `npm run build -w @saphnexa/web`
- `npm run test:contract`
- `npm run web:flow:check`
- `npm test`
- `npm run docs:check`
- `git diff --check`

## 検証結果

- `npm run typecheck -w @saphnexa/api-client`: fail -> `apiDelete` の `RequestInit.headers` undefined を修正後 pass。
- `npm run typecheck:source`: pass。
- `npm run typecheck`: pass。
- `npm run typecheck -w @saphnexa/web`: pass。
- `npm run build -w @saphnexa/web`: pass。
- `npm run test:contract`: pass。
- `npm run web:flow:check`: pass。
- `npm test`: pass。15 tests。
- `npm run docs:check`: pass。
- `git diff --check`: pass。

## PR レビュー観点

- `apiRoutes` の helper 名が `ApiOperationId` と矛盾していないこと。
- helper path が `publicApiRoutes.viewerPath` と同期していること。
- path parameter の encode 漏れや placeholder 残りがないこと。
- full route helper coverage を OpenAPI generated client 完了として過大表現していないこと。

## リスク・制約

- 今回は route helper 網羅に限定するため、OpenAPI schema からの request/response 型生成は未対応。
- 実 CloudFront/Cognito HTTP、AWS runtime validation は未対応。
