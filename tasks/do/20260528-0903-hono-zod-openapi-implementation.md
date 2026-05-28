# Hono Zod OpenAPI 実装導線

## 背景

ユーザーは基本設計 v0.17 をもとに、2. Hono + Zod + OpenAPI 本実装を含む 1-6 を進め、7. AWS dev/UAT E2E・性能・RAG 品質検証ができる状態にすることを求めている。

現状は `packages/api-contract/src/routes.js` に contract metadata があり、`apps/api/src/local-api.js` にローカル実行用 dispatcher がある。一方、ADR では Hono/Zod/OpenAPI 実依存が未導入であることが明記されており、API の本実装 entrypoint と OpenAPI 生成導線が不足している。

## 目的

設計済み 38 route を Hono + Zod + OpenAPI の実装エントリポイントとして表現し、AWS dev/UAT の Hono API deploy と OpenAPI 証跡取得へ進める状態に近づける。

## スコープ

- `apps/api` に Hono/Zod/OpenAPI 用の app builder と OpenAPI document builder を追加する。
- `apps/api/package.json` に Hono/Zod/OpenAPI 依存と OpenAPI 出力 script を追加する。
- route contract と OpenAPI document の整合を検査する tool/script を追加する。
- local verification docs と作業レポートを更新する。
- 実 Lambda deploy、実 HTTP リクエスト検証、依存 install は今回の範囲外。ただし未実施を pass として扱わない。

## タスク種別

機能追加

## 計画

1. API contract metadata の route 38 件から OpenAPI document を生成する module を追加する。
2. Hono app builder を追加し、認証境界を前提に `/openapi.json` と各 route placeholder handler を定義する。
3. Zod schema catalog を追加し、request/response validation metadata を route ごとに紐付ける。
4. checker と npm script を追加する。
5. docs とレポートを更新し、検証を実行する。

## ドキュメント保守計画

- `docs/ops/local-verification.md` に Hono/Zod/OpenAPI 実装導線の local check を追記する。
- ADR の「未導入」記述は今回の PR で完全解消とは言い切れないため、最終回答/作業レポートで残範囲を明記する。

## 受け入れ条件

- `apps/api` に Hono/Zod/OpenAPI app builder が追加され、38 route と `/openapi.json` を表現する。
- OpenAPI document に設計済み 38 route の internal path が含まれ、operationId が重複しない。
- state-changing route に CSRF header metadata が残る。
- `apps/api/package.json` に Hono、Zod、OpenAPI 関連 dependency と script が宣言される。
- 変更範囲に対して `npm run api:openapi:check`、`npm run test:contract`、`npm run docs:check`、`git diff --check` を実行し、結果を記録する。

## 検証計画

- `npm run api:openapi:check`
- `npm run test:contract`
- `npm run docs:check`
- `git diff --check`

## 実施結果

- `apps/api/src/openapi-document.js` を追加し、`packages/api-contract` の 38 route から OpenAPI 3.1 document と Hono route definition を生成するようにした。
- `apps/api/src/hono-openapi-app.js` を追加し、`OpenAPIHono` / `createRoute` / `/openapi.json` / dispatcher bridge を定義した。
- `apps/api/src/zod-openapi-schemas.js` を追加し、route ごとの params/query/header/body/response schema catalog を定義した。
- `apps/api/package.json` に Hono/Zod/OpenAPI 依存と `openapi:print` script を追加した。
- `tools/check-api-openapi.js`、`tools/check-contracts.js`、`tests/contract.test.js`、docs check を更新し、OpenAPI と route contract の整合を検査した。
- `npm view` による依存 version 確認は sandbox network 制約で `EAI_AGAIN` になったため、実 install は未実施として扱う。

## 検証結果

- `npm run api:openapi:check`: pass
- `npm run test:contract`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass
- `npm test`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass

## 作業レポート

- `reports/working/20260528-0908-hono-zod-openapi-implementation.md`

## PR レビュー観点

- Hono app が local dispatcher の権限チェックを迂回して本番データを返す構造になっていないこと。
- OpenAPI 生成が route contract と乖離しないこと。
- Zod/OpenAPI metadata が fixture 固有値や dev/UAT 証跡を偽装していないこと。

## リスク

- 依存 install は今回未実行のため、Hono runtime 起動は未検証。
- 実 Lambda adapter、Cognito authorizer、CSRF cookie integration は後続で実装・検証が必要。

## 状態

in_progress
