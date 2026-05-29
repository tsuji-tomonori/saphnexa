# API TypeScript source of record 作業レポート

## 指示

- `.workspace/plan-20260529.txt` と基本設計 v0.17 package を根拠に、plan の内容を継続して進める。
- Hono backend が `.js` 実装中心で TypeScript 実装として未達という指摘を前進させる。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | Hono app factory の TypeScript source を追加する | 対応 |
| R2 | OpenAPI document builder の TypeScript source を追加する | 対応 |
| R3 | Zod schema catalog の TypeScript source を追加する | 対応 |
| R4 | 既存 Node local tools/tests の `.js` import 互換を壊さない | 対応 |
| R5 | OpenAPI/source gate が `.ts` source of record を検査する | 対応 |
| R6 | 公開 API 38 route と OpenAPI metadata を維持する | 対応 |
| R7 | 実 Lambda / DSQL / Cognito 接続や実 `tsc` compilation を実施済み扱いしない | 対応 |

## 検討・判断

- Node v22 の標準実行では `.ts` import が `ERR_UNKNOWN_FILE_EXTENSION` になることを確認した。
- 既存 tools/tests は `node` で `.js` を import するため、`.js` runtime mirror は残す必要がある。
- そのため、今回の source of record 化は `.ts` source を追加し、source gate が `.ts` を検査する形にした。`.js` runtime mirror は既存 Node local 実行互換のため残した。
- `apps/api/src/app.ts` は TypeScript Hono/OpenAPI source を使う entry へ整理した。

## 実施作業

- `apps/api/src/hono-openapi-app.ts` を追加。
- `apps/api/src/openapi-document.ts` を追加。
- `apps/api/src/zod-openapi-schemas.ts` を追加。
- `apps/api/src/app.ts` を `createSaphnexaHonoOpenApiApp` 利用へ整理。
- `tools/check-api-openapi.js` を `.ts` source of record 検査へ更新。
- `tools/check-type-surface.js` を API TS source 境界の検査へ更新。
- `docs/ops/local-verification.md` に TypeScript source と `.js` runtime mirror の確認範囲を追記。

## 成果物

| 成果物 | 内容 |
|---|---|
| `apps/api/src/hono-openapi-app.ts` | TypeScript Hono app factory |
| `apps/api/src/openapi-document.ts` | TypeScript OpenAPI document builder |
| `apps/api/src/zod-openapi-schemas.ts` | TypeScript Zod OpenAPI schema catalog |
| `apps/api/src/app.ts` | TypeScript API app entry |
| `tools/check-api-openapi.js` | API OpenAPI source gate |
| `tools/check-type-surface.js` | TypeScript source surface gate |
| `docs/ops/local-verification.md` | local verification docs update |

## 実行した検証

- `npm run typecheck`: pass
- `npm run api:openapi:check`: pass
- `npm run test:contract`: pass
- `npm run test:integration:local`: pass
- `npm test`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass

## 未対応・制約・リスク

- 実 `tsc` compilation は未実施。この環境では `tsc` 実体が未導入で、`npm run typecheck` は repository の source gate。
- `.ts` runtime import / bundle 生成は未実施。標準 `node` は `.ts` import 非対応のため、既存 local tools/tests は `.js` runtime mirror を使う。
- 実 Lambda adapter、Cognito session / CSRF cookie integration、DSQL repository 接続は未実施。

## Fit 評価

総合fit: 4.1 / 5.0（約82%）

理由: Hono/OpenAPI/Zod の TypeScript source と source gate は追加できたが、実 compilation と runtime bundle 生成、実 Lambda/DSQL/Cognito 接続は未実施のため満点ではない。
