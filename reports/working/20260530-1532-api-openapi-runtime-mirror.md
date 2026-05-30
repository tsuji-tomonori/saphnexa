# API OpenAPI runtime mirror generation report

## 指示

- `.workspace/plam-20260530-01.txt` に対応する継続作業として、API TypeScript source-of-truth 化と source JS transition gate を前進させる。
- repository local rules に従い、task md、検証、作業レポート、commit / PR コメントまで実施する。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | API Hono/OpenAPI/Zod/middleware JS mirror を TS 正本から生成する | 対応 |
| R2 | plan が指摘した Hono TS/JS middleware 差分を解消する | 対応 |
| R3 | `api:openapi:check` と `typecheck:source` に drift check を組み込む | 対応 |
| R4 | source JS allowlist と local verification docs を generated mirror として更新する | 対応 |
| R5 | 実施していない production coverage / DSQL / local auth 実装を完了扱いしない | 対応 |

## 検討・判断

- `hono-openapi-app.js` は手書き mirror で、TS source にある error / request-log / origin / session / csrf middleware が欠けていたため、TS source から生成する方式へ移した。
- runtime JS は Node checks が直接 import するため、middleware も `.js` mirror を生成対象に含め、relative import を `.js` へ変換した。
- TypeScript の型削除と import 変換は `typescript.transpileModule` を利用し、generator 内で generated header と主要 behavior token を検査する形にした。
- `local-api.js` の dispatcher 分割、auth local fixture、DSQL production mapping は plan 上の残作業だが、今回の scope は OpenAPI runtime mirror 生成と drift check に限定した。

## 実施作業

- `tools/generate-api-openapi-runtime-mirror.js` を追加した。
- `apps/api/src/hono-openapi-app.js`、`openapi-document.js`、`zod-openapi-schemas.js`、`middleware/*.js` を generated header 付き mirror に更新・追加した。
- `package.json` に `api:openapi:generate` を追加した。
- `Taskfile.yml` に `api:openapi:generate` を追加し、`api:openapi:check` の説明を更新した。
- `tools/check-api-openapi.js` に API OpenAPI runtime mirror drift check と Hono middleware mirror assertion を統合した。
- `tools/check-type-surface.js` に API OpenAPI runtime mirror drift check を統合した。
- `tools/source-js-allowlist.json` の API OpenAPI/middleware JS 理由を generated runtime mirror に更新した。
- `docs/ops/local-verification.md` に API OpenAPI runtime mirror check を追記した。
- `tasks/do/20260530-1532-api-openapi-runtime-mirror.md` に受け入れ条件と検証計画を記録した。

## 成果物

| 成果物 | 内容 |
|---|---|
| `tools/generate-api-openapi-runtime-mirror.js` | API OpenAPI runtime mirror 生成・検査 script |
| `apps/api/src/hono-openapi-app.js` | TS source 由来の generated Hono/OpenAPI mirror |
| `apps/api/src/openapi-document.js` | TS source 由来の generated OpenAPI document mirror |
| `apps/api/src/zod-openapi-schemas.js` | TS source 由来の generated Zod schema mirror |
| `apps/api/src/middleware/*.js` | TS source 由来の generated middleware mirror |
| `tools/check-api-openapi.js` / `tools/check-type-surface.js` | drift check 統合 |
| `Taskfile.yml` / `docs/ops/local-verification.md` / `tools/source-js-allowlist.json` | 検証導線と generated mirror 説明 |

## 実行した検証

- `npm run api:openapi:generate`: pass
- `npm run api:openapi:check`: pass
- `npm run test:contract`: pass
- `npm run typecheck:source`: pass
- `npm run check:no-src-js`: pass
- `npm run check:static`: pass
- `npm run ci:check`: pass
- `git diff --check`: pass

## Fit 評価

総合fit: 4.8 / 5.0（約96%）

理由: plan が明示していた `hono-openapi-app.ts` と `.js` の middleware 差分を解消し、API OpenAPI/Zod/middleware runtime mirror を generated source に移した。一方で `.workspace/plam-20260530-01.txt` 全体に対する残作業として、`local-api.js`、DSQL unmapped operation、production-ready implementation coverage、Tools/Agent 分割は残っている。

## 未対応・制約・リスク

- 未対応: `apps/api/src/local-api.js` の dispatcher 分割、`loginStart` / `authCallback` / `logout` local fixture、本番 DSQL mapping 完了は今回の task scope 外。
- 制約: AWS dev/UAT 実接続、Cognito callback、実 Lambda / CloudFront 経由 HTTP request は未実施。
- リスク: generated JS は Node checks 用の runtime compatibility mirror であり、production bundle 生成済みの証跡ではない。
