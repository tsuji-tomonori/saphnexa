# Shared contract TypeScript types 作業レポート

## 指示

- `.workspace/plan-20260529.txt` と基本設計 v0.17 package を根拠に、plan の内容を継続して進める。
- API schema / model catalog / tool contract / DB type の共有境界が未完成という指摘を前進させる。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | API route metadata の TypeScript source と export 型を追加する | 対応 |
| R2 | Tools API contract の TypeScript source と export 型を追加する | 対応 |
| R3 | Model catalog / cost estimate の TypeScript source と export 型を追加する | 対応 |
| R4 | DB required table list の TypeScript source と union 型を追加する | 対応 |
| R5 | TS source と JS runtime mirror の件数・主要 ID 同期を gate で確認する | 対応 |
| R6 | 自動 codegen や実 `tsc` compilation を実施済み扱いしない | 対応 |

## 検討・判断

- 既存 local tools/tests は `.js` runtime を import しているため、今回も runtime 値は変えずに `.ts` source と型 surface を追加した。
- 二重管理のズレを抑えるため、`tools/check-type-surface.js` で API route ID / operation ID、tool name / operation ID、model ID、DB table name の件数と主要 ID を JS runtime と照合するようにした。
- OpenAPI 生成型や DB introspection までは進めず、後続 codegen の前段として共有型を明示した。

## 実施作業

- `packages/api-contract/src/routes.ts` を追加。
- `packages/tool-contract/src/tools.ts` を追加。
- `packages/model-catalog/src/models.ts` と `cost-estimate.ts` を追加。
- `packages/db-schema/src/tables.ts` を追加。
- `tools/check-type-surface.js` に TS/JS 同期 gate を追加。
- `docs/ops/local-verification.md` に shared TS contract source の確認範囲と未完了範囲を追記。

## 成果物

| 成果物 | 内容 |
|---|---|
| `packages/api-contract/src/routes.ts` | API route metadata types |
| `packages/tool-contract/src/tools.ts` | Tools API contract types |
| `packages/model-catalog/src/models.ts` | Model catalog types |
| `packages/model-catalog/src/cost-estimate.ts` | Cost estimate types |
| `packages/db-schema/src/tables.ts` | Required table union type |
| `tools/check-type-surface.js` | TS/JS shared contract sync gate |
| `docs/ops/local-verification.md` | local verification docs update |

## 実行した検証

- `npm run typecheck`: fail -> 正規表現の source gate 不備を修正後 pass
- `npm run test:contract`: pass
- `npm test`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass

## 未対応・制約・リスク

- OpenAPI からの自動型生成、DB introspection/codegen、`.ts` source からの runtime artifact 生成は未実施。
- 実 `tsc` compilation は未実施。この環境では `tsc` 実体が未導入で、`npm run typecheck` は repository の source gate。
- `.ts` source と `.js` runtime mirror の二重管理は暫定であり、依存 install 後の codegen / build 整備で単一 source 化する余地がある。

## Fit 評価

総合fit: 4.0 / 5.0（約80%）

理由: 共有型 surface と同期 gate は追加できたが、自動 codegen と実 TypeScript compilation は未実施のため満点ではない。
