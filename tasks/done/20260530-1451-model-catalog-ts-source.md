# Model catalog TS 正本化

## 背景

`.workspace/plam-20260530-01.txt` は TypeScript source-of-truth 化と source JS mirror 廃止・生成化を求めている。現状の `packages/model-catalog/src/models.ts` は型と `modelIds` のみを持ち、実データ `llmModels` は `models.js` 側にある。同様に `cost-estimate.ts` は型と schema version のみで、実データ `localCostEstimate` は `cost-estimate.js` 側にある。

## 目的

Model catalog と local cost estimate の実データを TypeScript source に移し、既存 runtime import 互換の `.js` は TypeScript source から生成・検査される mirror にする。

## タスク種別

機能追加

## スコープ

- `packages/model-catalog/src/models.ts` に `llmModels` 実データを追加する。
- `packages/model-catalog/src/cost-estimate.ts` に `localCostEstimate` 実データを追加する。
- `models.ts` / `cost-estimate.ts` から `.js` runtime mirror を生成する script を追加する。
- check mode で committed `.js` mirror と generator 出力の一致を検査する。
- model catalog / cost estimate の既存検査導線に generated mirror 検査を組み込む。
- docs と source JS allowlist を generated mirror 前提に更新する。

## スコープ外

- `packages/model-catalog/src/*.js` の完全削除。
- DB schema、domain、RAG、testing package の JS mirror 生成化。
- production-ready strict source JS gate を pass させること。
- 実 AWS Pricing Calculator 証跡の取得。

## 実施計画

1. JS 側にある model / cost 実データを TS source へ移す。
2. TS source から runtime JS mirror を生成する script を追加する。
3. 既存 `.js` mirror を generated header 付き出力へ更新する。
4. check script、package scripts、Taskfile、docs、allowlist を更新する。
5. targeted checks と `check:static` を実行する。
6. 作業レポート、commit、push、PR コメント、task done 更新を行う。

## ドキュメント保守方針

`docs/ops/local-verification.md` に、model catalog runtime mirror が TS source から生成され、check mode で一致検査されることを追記する。

## 受け入れ条件

- [x] AC1: `llmModels` が TypeScript source に定義されている。
- [x] AC2: `localCostEstimate` が TypeScript source に定義されている。
- [x] AC3: `model-catalog:generate` が `.js` runtime mirror を生成できる。
- [x] AC4: `model-catalog:check` が committed mirror と生成結果の一致を検査できる。
- [x] AC5: model catalog / cost estimate の既存検査導線で generated mirror drift を検出できる。
- [x] AC6: `npm run check:no-src-js` が pass する。
- [x] AC7: `npm run check:static` が pass する。
- [x] AC8: `git diff --check` が pass する。
- [x] AC9: PR に受け入れ条件確認とセルフレビュー更新を日本語で投稿する。

## 検証計画

- `npm run model-catalog:check`
- `npm run typecheck:source`
- `npm run cost:check`
- `npm run check:no-src-js`
- `npm run check:static`
- `git diff --check`

## PR レビュー観点

- model / cost 実データの値が JS から TS へ変化なく移っていること。
- `.js` mirror が TS source 由来であることを機械的に確認できること。
- 架空の production cost 証跡や実 AWS Pricing Calculator 証跡を追加していないこと。

## リスク

- generator は model catalog TS source の現在の export 書式に依存する。書式変更時は generator と check が fail するようにし、無音 drift を避ける。

## 状態

done
