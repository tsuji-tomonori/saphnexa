# Domain runtime mirror 生成化 作業レポート

## 受けた指示

`.workspace/plam-20260530-01.txt` の TypeScript source-of-truth 化方針に沿って、Domain public surface と observability catalog の JS runtime mirror を TypeScript source から生成・検査可能な状態へ寄せる。

## 要件整理

- `packages/domain/src/index.ts` と `packages/domain/src/observability.ts` を正本として扱う。
- runtime import 互換のため `.js` mirror は残すが、生成物であることを明示する。
- committed mirror と generator 出力の一致を検査できるようにする。
- 既存の type surface / observability check で drift を検出できるようにする。
- Domain store、API、RAG、認可境界の挙動は変えない。

## 検討・判断

- `store.js` は大きな local store 実装であり、TS 正本化には型・runtime import・既存 API fixture の整理が必要なため今回のスコープ外とした。
- 小さく安定した `index.ts` / `observability.ts` から先に JS mirror を生成化し、source JS の手書き面を減らす方針を採用した。
- `typecheck:source` と `observability:check` に generator `--check` を組み込み、通常の静的検査で drift を検出できるようにした。

## 実施作業

- `tools/generate-domain-runtime-mirror.js` を追加し、Domain TS source から `index.js` / `observability.js` を生成できるようにした。
- `packages/domain/src/index.js` と `packages/domain/src/observability.js` を generated header 付きの mirror に更新した。
- `tools/check-type-surface.js` と `tools/check-observability-catalog.js` に generated mirror check を統合した。
- `package.json` と `Taskfile.yml` に `domain:generate` / `domain:check` を追加した。
- `docs/ops/local-verification.md` と `tools/source-js-allowlist.json` を generated mirror 前提に更新した。

## 成果物

- 生成 script: `tools/generate-domain-runtime-mirror.js`
- 生成対象: `packages/domain/src/index.js`
- 生成対象: `packages/domain/src/observability.js`
- 検証導線: `npm run domain:check`
- 検証統合: `npm run typecheck:source`
- 検証統合: `npm run observability:check`

## 検証

- `npm run domain:check`: pass
- `npm run typecheck:source`: pass
- `npm run observability:check`: pass
- `npm run check:no-src-js`: pass
- `npm run check:static`: pass
- `npm run ci:check`: pass
- `git diff --check`: pass

## 指示への fit 評価

Domain constants / helper / observability catalog の `.js` mirror を TypeScript source から生成・検査できる状態にし、TypeScript source-of-truth 化の一段階として fit している。Domain store や全 source JS 廃止は未達。

## 未対応・制約・リスク

- `.workspace/plam-20260530-01.txt` 全体の production-ready strict gate、source JS 全廃、API / Tools production 実装完了は未完了。
- `packages/domain/src/store.js` は今回未対応。local store の TS 正本化には別タスクが必要。
- generator は Domain TS source の現行 export 書式に依存する。書式変更時は generator / check の更新が必要。
