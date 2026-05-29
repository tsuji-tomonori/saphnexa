# API Zod response runtime validation

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-29 11:54 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` は、Hono backend が Hono + Zod OpenAPI の骨格から TypeScript/Zod/OpenAPI 生成型と runtime validation へ進む必要があるとしている。直前の作業で OpenAPI/generated client 型は nested response まで進んだが、`apps/api/src/zod-openapi-schemas.ts` の success response は `z.object({}).passthrough()` のままで、Hono dispatcher の返却 body を runtime validation していない。

## 目的

主要 success response の Zod schema を具体化し、Hono dispatcher の成功レスポンスを route ごとの Zod schema で検証する runtime boundary を追加する。

## スコープ

- `apps/api/src/zod-openapi-schemas.ts` と JS mirror に主要 response schema helper を追加する。
- request body schema の共通フィールドを OpenAPI document 側と揃える。
- Hono app で 2xx JSON response を `schemas.response.safeParse` し、不一致時は標準 error response を返す。
- source/contract gate で response schema が passthrough-only でないことと runtime validation 境界を確認する。
- 実 CloudFront/Cognito HTTP、AWS runtime validation、全 route 全 field の完全 schema 化は別 slice とし、完了扱いにしない。

## 実装計画

1. 現在の Zod schema catalog と Hono dispatch boundary を確認する。
2. 主要 domain response schema helper を Zod catalog に追加する。
3. Hono app に success response runtime validation を追加する。
4. source gate / docs / report を更新する。
5. typecheck、contract、source gate、local tests を実行する。

## ドキュメント保守方針

API route contract の path/status は変えない。local verification docs に、Zod response runtime validation は主要 success response の local/Hono 境界であり、実 CloudFront/Cognito/AWS runtime validation ではないことを追記する。

## 受け入れ条件

- [x] 主要 success response が concrete Zod field schema を持つ。
- [x] Hono dispatcher の 2xx JSON response が route response schema で runtime validation される。
- [x] response validation 不一致時に標準 error response を返す境界がある。
- [x] source/contract/typecheck が pass する。
- [x] 実 CloudFront/Cognito HTTP、AWS runtime validation、全 route 全 field 完全型付けを完了扱いにしない。

## 検証計画

- `npm run typecheck:source`
- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck`
- `npm run test:contract`
- `npm run api:openapi:check`
- `npm test`
- `npm run docs:check`
- `git diff --check`

## PR レビュー観点

- Zod response schema が OpenAPI/generated type の代表 field と整合していること。
- runtime validation が成功レスポンス境界に限定され、認可/CSRF/session の意味を変えていないこと。
- validation failure を成功扱いせず、標準 error response に変換していること。
- 実 AWS runtime validation を過大に完了扱いしていないこと。

## 検証結果

- `npm run typecheck:source`: pass。
- `npm run typecheck -w @saphnexa/api`: 初回 fail。`apps/api/tsconfig.json` が workspace package TS/JS import を `rootDir` / include に含めていなかったため。tsconfig を更新後 pass。
- `npm run typecheck`: pass。
- `npm run test:contract`: pass。
- `npm run api:openapi:check`: pass。invalid dispatcher success response が `RESPONSE_VALIDATION_FAILED` で 500 になることも検査。
- `npm test`: pass。15 tests。
- `npm run docs:check`: pass。
- `git diff --check`: pass。

## リスク・制約

- 今回は主要 response schema に限定する。
- 実 CloudFront/Cognito 経由 HTTP、AWS runtime validation は未対応。
