# Contract runtime mirror 生成化 作業レポート

## 受けた指示

`.workspace/plam-20260530-01.txt` の TypeScript source-of-truth 化方針に沿って、API / Tool contract の手書き `.js` runtime mirror を生成・検査可能な状態へ寄せる。

## 要件整理

- `packages/api-contract/src/routes.ts` と `packages/tool-contract/src/tools.ts` を正本として扱う。
- runtime import 互換のため `.js` mirror は残すが、生成物であることを明示する。
- committed mirror と generator 出力の一致を検査できるようにする。
- 既存の contract check で drift を検出できるようにする。
- production-ready strict source JS gate や production 実装完了を達成済みとして扱わない。

## 検討・判断

- `.js` mirror の完全削除は Node test / runtime import の整理が必要なため今回のスコープ外とした。
- generator は contract TS source の現行 literal array / factory call 形式を抽出する最小実装にした。書式変更時は `--check` または `test:contract` で失敗させる。
- `test:contract` に generated marker と generator `--check` を組み込み、既存の契約検査導線で drift を検出できるようにした。

## 実施作業

- `tools/generate-contract-runtime-mirror.js` を追加し、API / Tool contract TS source から JS runtime mirror を生成できるようにした。
- `packages/api-contract/src/routes.js` と `packages/tool-contract/src/tools.js` を generated header 付きの mirror に更新した。
- `tools/check-contracts.js` に generated marker 確認と generator `--check` 実行を追加した。
- `package.json` と `Taskfile.yml` に `contract-mirror:generate` / `contract-mirror:check` を追加した。
- `docs/ops/local-verification.md` と `tools/source-js-allowlist.json` を generated mirror 前提に更新した。

## 成果物

- 生成 script: `tools/generate-contract-runtime-mirror.js`
- 生成対象: `packages/api-contract/src/routes.js`
- 生成対象: `packages/tool-contract/src/tools.js`
- 検証導線: `npm run contract-mirror:check`
- 検証統合: `npm run test:contract`

## 検証

- `npm run contract-mirror:check`: pass
- `npm run test:contract`: pass
- `npm run check:no-src-js`: pass
- `npm run check:static`: pass
- `npm run ci:check`: pass
- `git diff --check`: pass

## 指示への fit 評価

contract `.js` mirror を `.ts` source から生成・検査できる状態にし、TypeScript source-of-truth 化の一段階として fit している。既存 runtime 互換のため JS mirror は残しており、完全な source JS 廃止は未達。

## 未対応・制約・リスク

- `.workspace/plam-20260530-01.txt` 全体の production-ready strict gate、source JS 全廃、API / Tools production 実装完了は未完了。
- generator は contract TS source の現行 factory call 書式に依存する。書式変更時は generator / check の更新が必要。
- `apps/api/src/*.js`、`apps/tools-api/src/local-tools-api.js`、他 packages の JS mirror 生成化・削除は今回未対応。
