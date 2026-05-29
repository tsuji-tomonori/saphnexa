# API client route helpers

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-29 10:43 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` は API schema / frontend/backend 共有型を強化する必要があるとしている。現在の `@saphnexa/api-client` は `apiGet<T>(path: string)` / `apiPost<T>(path: string, ...)` の薄い wrapper で、API contract の operation/path と Web fetch 呼び出しの同期を source-level で検査できない。

## 目的

API contract 由来の route helper を `@saphnexa/api-client` に追加し、Web の主要 fetch が任意 string ではなく共有 route helper を通る状態へ進める。

## スコープ

- `packages/api-client/src/client.ts` に `ApiClientPath`、`apiRoutes`、operation-specific route helper を追加する。
- Web hooks/pages の主要 API 呼び出しを `apiRoutes` 経由へ更新する。
- source gate で API client route helper と `packages/api-contract/src/routes.ts` の主要 operation/path token 同期を確認する。
- local verification docs に API client route helper の検証範囲を追記する。
- OpenAPI からの自動 client 生成や全 route helper 網羅は扱わない。

## 実装計画

1. API client に `ApiClientPath` と主要 route helper を追加する。
2. Web の `me`、chat sessions、submit question、message events、ws ticket、admin artifacts、evaluation run の呼び出しを helper に置き換える。
3. `tools/check-type-surface.js` と docs を更新する。
4. typecheck、web build、contract/docs/diff check を実行する。

## ドキュメント保守方針

実 API contract は変えないため、`docs/ops/local-verification.md` の source gate 説明のみ最小更新する。

## 受け入れ条件

- [x] `@saphnexa/api-client` が API contract 由来の typed route helper を export する。
- [x] `apiGet` / `apiPost` が `/api/*` または `/auth/*` の typed path を受ける。
- [x] Web の主要 API 呼び出しが route helper を使う。
- [x] source gate が API client route helper と API contract の主要 operation/path token 同期を確認する。
- [x] OpenAPI からの自動 client 生成や全 route helper 網羅を完了扱いにしない。

## 検証計画

- `npm run typecheck`
- `npm run typecheck -w @saphnexa/api-client`
- `npm run typecheck -w @saphnexa/web`
- `npm run build -w @saphnexa/web`
- `npm run test:contract`
- `npm run docs:check`
- `git diff --check`

## 検証結果

- `npm run typecheck`: pass。
- `npm run typecheck -w @saphnexa/api-client`: pass。
- `npm run typecheck -w @saphnexa/web`: pass。
- `npm run build -w @saphnexa/web`: pass。
- `npm run test:contract`: pass。
- `npm test`: pass。15 tests。
- `npm run docs:check`: pass。
- `git diff --check`: pass。

## PR レビュー観点

- route helper が API contract の operation/path と矛盾しないこと。
- Web が absolute URL や外部 origin を使うように退行していないこと。
- OpenAPI generated client 完了のように誤表現していないこと。

## リスク・制約

- 今回は Web で使う主要 route helper から進めるため、全 38 route の完全 generated client は別 slice の対象。
- `path: string` から typed path へ制約するが、runtime は引き続き browser fetch wrapper であり、実 CloudFront/Cognito 経由の HTTP は未検証。
