# OpenAPI client operation types

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-29 11:10 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` は、Zod/OpenAPI 生成型と frontend/backend 共有型が未完成であるとしている。直前の API client full route coverage では全 38 public API route の route helper を追加したが、request/response 型 map はまだ API client 側に存在しない。

## 目的

OpenAPI document / `publicApiRoutes` から API client operation 型を生成し、frontend client が operation ごとの method、viewer path、params、query、request body、success response、error response を型として参照できる状態へ進める。

## スコープ

- `tools/build-api-client-operation-types.js` を追加し、API contract/OpenAPI document から `packages/api-client/src/generated/operation-types.ts` を生成する。
- generated TS には全 38 operation の request/response 型 map を含める。
- drift check を `tools/check-type-surface.js` または専用 check に組み込み、生成物が古い場合に検出する。
- `packages/api-client/src/client.ts` から generated operation 型を export する。
- OpenAPI schema からの詳細 field-level 型生成や実 HTTP 通信の置換は別 slice とし、完了扱いにしない。

## 実装計画

1. OpenAPI document と `publicApiRoutes` から operation 型 TS を生成する script を追加する。
2. generated `operation-types.ts` を追加し、API client から再 export する。
3. source gate に generated file drift 検査と全 operation 型 coverage 検査を追加する。
4. local verification docs と作業レポートを更新する。
5. typecheck、contract/openapi/docs/diff check を実行する。

## ドキュメント保守方針

API route contract は変えない。local verification docs に、API client が route helper に加えて generated operation type map を持ち、drift check で同期確認することを追記する。

## 受け入れ条件

- [x] generated `operation-types.ts` が全 38 public API operation を含む。
- [x] 各 operation 型が method、viewer path、internal path、params、query、request body、success response、error response を表現する。
- [x] 生成物の drift check が `publicApiRoutes` / OpenAPI document との差分を検出できる。
- [x] `@saphnexa/api-client` が generated operation 型を export する。
- [x] field-level の完全 OpenAPI schema 型生成や実 CloudFront/Cognito HTTP を完了扱いにしない。

## 検証計画

- `node tools/build-api-client-operation-types.js --check`
- `npm run typecheck:source`
- `npm run typecheck -w @saphnexa/api-client`
- `npm run typecheck`
- `npm run test:contract`
- `npm run api:openapi:check`
- `npm run docs:check`
- `git diff --check`

## 検証結果

- `node tools/build-api-client-operation-types.js --check`: pass。
- `npm run api-client:operation-types:check`: pass。
- `npm run typecheck:source`: pass。
- `npm run typecheck -w @saphnexa/api-client`: pass。
- `npm run typecheck`: pass。
- `npm run typecheck -w @saphnexa/web`: pass。
- `npm run build -w @saphnexa/web`: pass。
- `npm run test:contract`: pass。
- `npm run api:openapi:check`: pass。
- `npm run docs:check`: pass。
- `git diff --check`: pass。
- `rg -c '^  [a-zA-Z].*: \\{$' packages/api-client/src/generated/operation-types.ts`: 38。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4569895953
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4569897461

## PR レビュー観点

- generated file が `publicApiRoutes` と OpenAPI document から一貫して生成されていること。
- 型 map が route helper と operationId を取り違えていないこと。
- drift check が手編集された生成物を検出できること。
- 詳細 schema 生成未対応を過大に完了扱いしていないこと。

## リスク・制約

- 今回の generated 型は operation 単位の skeleton 型であり、詳細 response field までは OpenAPI schema から展開しない。
- 実 CloudFront/Cognito 経由 HTTP、AWS runtime validation は未対応。
