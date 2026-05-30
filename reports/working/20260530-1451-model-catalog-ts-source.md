# Model catalog TS 正本化 作業レポート

## 受けた指示

`.workspace/plam-20260530-01.txt` の TypeScript source-of-truth 化方針に沿って、model catalog と local cost estimate の実データを TypeScript source へ移し、JS runtime mirror を生成・検査可能な状態へ寄せる。

## 要件整理

- `llmModels` と `localCostEstimate` の実データを TypeScript source に置く。
- runtime import 互換のため `.js` mirror は残すが、生成物であることを明示する。
- committed mirror と generator 出力の一致を検査できるようにする。
- 既存の type surface / cost estimate check で drift を検出できるようにする。
- 実 AWS Pricing Calculator 証跡や production cost 証跡は追加しない。

## 検討・判断

- `.js` mirror の完全削除は既存 Node runtime import の整理が必要なため今回のスコープ外とした。
- `models.ts` と `cost-estimate.ts` に実データを追加し、型の `satisfies` で TS source 側の整合を担保した。
- generator は現行 export 書式を抽出する最小実装にした。書式変更時は `--check`、`typecheck:source`、`cost:check` のいずれかで失敗させる。

## 実施作業

- `packages/model-catalog/src/models.ts` に `llmModels` を追加した。
- `packages/model-catalog/src/cost-estimate.ts` に `localCostEstimate` を追加した。
- `tools/generate-model-catalog-runtime-mirror.js` を追加し、TS source から `models.js` / `cost-estimate.js` を生成できるようにした。
- `tools/check-type-surface.js` と `tools/check-cost-estimate.js` に generated mirror check を統合した。
- `package.json` と `Taskfile.yml` に `model-catalog:generate` / `model-catalog:check` を追加した。
- `docs/ops/local-verification.md` と `tools/source-js-allowlist.json` を generated mirror 前提に更新した。

## 成果物

- TS 正本: `packages/model-catalog/src/models.ts`
- TS 正本: `packages/model-catalog/src/cost-estimate.ts`
- 生成 script: `tools/generate-model-catalog-runtime-mirror.js`
- 生成対象: `packages/model-catalog/src/models.js`
- 生成対象: `packages/model-catalog/src/cost-estimate.js`
- 検証導線: `npm run model-catalog:check`

## 検証

- `npm run model-catalog:check`: pass
- `npm run typecheck:source`: pass
- `npm run cost:check`: pass
- `npm run check:no-src-js`: pass
- `npm run check:static`: pass
- `npm run ci:check`: pass
- `git diff --check`: pass

## 指示への fit 評価

model catalog と local cost estimate の実データを TypeScript source-of-truth へ移し、JS mirror を生成・検査可能にしたため、計画の source-of-truth 化に直接 fit している。既存 runtime 互換のため JS mirror は残しており、完全な source JS 廃止は未達。

## 未対応・制約・リスク

- `.workspace/plam-20260530-01.txt` 全体の production-ready strict gate、source JS 全廃、API / Tools production 実装完了は未完了。
- generator は model catalog TS source の現行 export 書式に依存する。書式変更時は generator / check の更新が必要。
- 実 AWS Pricing Calculator 証跡は取得していない。既存の local planning estimate を TS source 化したのみ。
