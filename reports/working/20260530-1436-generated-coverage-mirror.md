# Coverage JS mirror 生成化 作業レポート

## 受けた指示

`.workspace/plam-20260530-01.txt` の TypeScript source-of-truth 化方針に沿って、coverage manifest の JS runtime mirror を手編集前提から生成・検査可能な状態へ寄せる。

## 要件整理

- API / Tools implementation coverage の `.ts` source を正とする。
- `.js` runtime mirror は既存 runtime import 互換のため残すが、生成物であることを明示する。
- committed mirror と generator 出力の一致を検査できるようにする。
- 既存の implementation coverage check / static check に drift 検出を組み込む。
- 実施していない production-ready strict gate を達成済みとして扱わない。

## 検討・判断

- `.js` mirror の完全削除は既存 runtime import の整理が必要なため今回のスコープ外とした。
- generator は現在の coverage manifest の factory call 形式を抽出する最小実装にした。書式が変わった場合は `--check` や source drift check で失敗させ、無音 drift を避ける。
- `check:implementation-coverage-source` に generated marker と `--check` を組み込み、個別 check と `check:static` の両方で検出できるようにした。

## 実施作業

- `tools/generate-implementation-coverage-mirror.js` を追加し、API / Tools coverage TS source から JS mirror を生成できるようにした。
- `packages/api-contract/src/implementation-coverage.js` と `packages/tool-contract/src/implementation-coverage.js` を generator 出力に更新し、generated header を付与した。
- `tools/check-implementation-coverage-source.js` に generated marker 確認と generator `--check` 実行を追加した。
- `package.json` と `Taskfile.yml` に `implementation-coverage:generate` / `implementation-coverage:check` を追加した。
- `docs/ops/local-verification.md` と `tools/source-js-allowlist.json` を generated mirror 前提に更新した。

## 成果物

- 生成 script: `tools/generate-implementation-coverage-mirror.js`
- 生成対象: `packages/api-contract/src/implementation-coverage.js`
- 生成対象: `packages/tool-contract/src/implementation-coverage.js`
- 検証導線: `npm run implementation-coverage:check`
- 検証統合: `npm run check:implementation-coverage-source`

## 検証

- `npm run implementation-coverage:check`: pass
- `npm run check:implementation-coverage-source`: pass
- `npm run api:implementation:check`: pass
- `npm run tools:implementation:check`: pass
- `npm run check:no-src-js`: pass
- `npm run check:static`: pass
- `npm run ci:check`: pass
- `git diff --check`: pass

## 指示への fit 評価

coverage manifest の `.js` mirror を `.ts` source から生成・検査できる状態にし、TypeScript source-of-truth 化の一段階として fit している。既存 runtime 互換のため JS mirror は残しており、完全な source JS 廃止は未達。

## 未対応・制約・リスク

- `.workspace/plam-20260530-01.txt` 全体の production-ready strict gate、source JS 全廃、全 module の atomicity / 90% coverage 達成は未完了。
- generator は coverage manifest の現行 factory call 書式に依存する。書式変更時は generator / check の更新が必要。
- `routes.js` / `tools.js` など他の JS mirror 生成化・削除は今回未対応。
