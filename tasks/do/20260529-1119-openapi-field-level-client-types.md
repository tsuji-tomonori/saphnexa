# OpenAPI field-level client types

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-29 11:19 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` は、Zod/OpenAPI 生成型と frontend/backend 共有型が未完成であるとしている。前回の OpenAPI client operation types では operation 単位の generated type map を追加したが、request/response は `ApiClientJsonObject` skeleton に留まっていた。

## 目的

OpenAPI document に request body と主要 success response の field-level schema を持たせ、API client generated 型が operation ごとの外側フィールドを TypeScript 型として参照できる状態へ進める。

## スコープ

- `apps/api/src/openapi-document.ts` と Node 実行用 mirror `apps/api/src/openapi-document.js` に request/response field schema を追加する。
- `tools/build-api-client-operation-types.js` が OpenAPI schema から TypeScript 型を生成するようにする。
- generated `operation-types.ts` を再生成し、request/response が field-level 型を含むことを source gate で確認する。
- `docs/ops/local-verification.md` に field-level skeleton の検証範囲を追記する。
- ネスト内部までの完全詳細型、実 CloudFront/Cognito HTTP、AWS runtime validation は別 slice とし、完了扱いにしない。

## 実装計画

1. OpenAPI document の request body schema を共通 body field schema へ置き換える。
2. operation ごとの success response outer fields を schema として定義する。
3. generator に object/array/primitive/ref schema の TypeScript 変換を追加する。
4. generated 型と source gate を更新し、docs/report を残す。
5. targeted validation を実行する。

## ドキュメント保守方針

API route contract 自体は変えない。local verification docs には、field-level 型は外側 wrapper fields までであり、ネスト内部の完全 schema 型生成は未対応であることを明記する。

## 受け入れ条件

- [x] OpenAPI success response schema が operation ごとの主要 outer field を表現する。
- [x] OpenAPI request body schema が `csrf_token`、`question`、`title`、`dataset_id` など主要 body field を表現する。
- [x] generated `operation-types.ts` の request/response 型が OpenAPI schema 由来の field-level 型を持つ。
- [x] source gate が generated 型に主要 field token が含まれることを検証する。
- [x] ネスト内部までの完全詳細型や実 HTTP 検証を完了扱いにしない。

## 検証計画

- `npm run api-client:operation-types:check`
- `npm run typecheck:source`
- `npm run typecheck -w @saphnexa/api-client`
- `npm run typecheck`
- `npm run test:contract`
- `npm run api:openapi:check`
- `npm run docs:check`
- `git diff --check`

## 検証結果

- `npm run api-client:operation-types:check`: pass。
- `npm run typecheck:source`: pass。
- `npm run typecheck -w @saphnexa/api-client`: pass。
- `npm run typecheck`: pass。
- `npm run typecheck -w @saphnexa/web`: pass。
- `npm run build -w @saphnexa/web`: pass。
- `npm run test:contract`: pass。
- `npm run api:openapi:check`: fail -> DELETE の CSRF route は request body なしのため、JSON body を持つ CSRF route に限定して修正後 pass。
- `npm run docs:check`: pass。
- `npm test`: pass。15 tests。
- `git diff --check`: pass。
- `rg -c "successResponse: \\{" packages/api-client/src/generated/operation-types.ts`: 32。

## PR レビュー観点

- OpenAPI document と JS mirror が同期していること。
- generated 型が generic object へ退行していないこと。
- response outer fields が local API の主要 response shape と矛盾しないこと。
- 未対応の詳細 schema / 実 HTTP 検証を過大に完了扱いしていないこと。

## リスク・制約

- 今回は outer field-level 型までで、配列要素や nested object の完全 schema 型は `ApiClientJsonObject` として残す。
- 実 CloudFront/Cognito 経由 HTTP、AWS runtime validation は未対応。
