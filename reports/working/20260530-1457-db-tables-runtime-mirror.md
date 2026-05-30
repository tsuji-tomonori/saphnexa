# DB tables runtime mirror 生成化 作業レポート

## 受けた指示

`.workspace/plam-20260530-01.txt` の TypeScript source-of-truth 化方針に沿って、required DB table list の JS runtime mirror を TypeScript source から生成・検査可能な状態へ寄せる。

## 要件整理

- `packages/db-schema/src/tables.ts` を required table list の正本として扱う。
- runtime import 互換のため `tables.js` は残すが、生成物であることを明示する。
- committed mirror と generator 出力の一致を検査できるようにする。
- 既存の type surface / DB metadata check で drift を検出できるようにする。
- DB metadata 全体の source-of-truth 変更や migration 意味変更は行わない。

## 検討・判断

- `table-metadata.js` は既に `tools/build-db-metadata-source.js` 由来の大きな生成物で、TS 正本化には DB metadata 生成方針全体の整理が必要なため今回のスコープ外とした。
- 小さく安定した `requiredTableNames` から先に JS mirror を生成化し、source JS の手書き面を減らす方針を採用した。
- `typecheck:source` と `db:metadata:check` に generator `--check` を組み込み、通常の静的検査で drift を検出できるようにした。

## 実施作業

- `tools/generate-db-tables-runtime-mirror.js` を追加し、`tables.ts` から `tables.js` を生成できるようにした。
- `packages/db-schema/src/tables.js` を generated header 付きの mirror に更新した。
- `tools/check-type-surface.js` と `tools/check-db-metadata.js` に generated mirror check を統合した。
- `package.json` と `Taskfile.yml` に `db-schema:tables:generate` / `db-schema:tables:check` を追加した。
- `docs/ops/local-verification.md` と `tools/source-js-allowlist.json` を generated mirror 前提に更新した。

## 成果物

- 生成 script: `tools/generate-db-tables-runtime-mirror.js`
- 生成対象: `packages/db-schema/src/tables.js`
- 検証導線: `npm run db-schema:tables:check`
- 検証統合: `npm run typecheck:source`
- 検証統合: `npm run db:metadata:check`

## 検証

- `npm run db-schema:tables:check`: pass
- `npm run typecheck:source`: pass
- `npm run db:metadata:check`: pass
- `npm run check:no-src-js`: pass
- `npm run check:static`: pass
- `npm run ci:check`: pass
- `git diff --check`: pass

## 指示への fit 評価

required DB table list の `.js` mirror を TypeScript source から生成・検査できる状態にし、TypeScript source-of-truth 化の一段階として fit している。DB metadata 全体や全 source JS 廃止は未達。

## 未対応・制約・リスク

- `.workspace/plam-20260530-01.txt` 全体の production-ready strict gate、source JS 全廃、API / Tools production 実装完了は未完了。
- `packages/db-schema/src/table-metadata.js` は今回未対応。metadata 全体の TS 正本化には別タスクが必要。
- generator は `tables.ts` の現行 array export 書式に依存する。書式変更時は generator / check の更新が必要。
