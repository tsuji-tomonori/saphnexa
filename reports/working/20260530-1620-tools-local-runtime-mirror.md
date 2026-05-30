# Tools API local runtime mirror generation 作業レポート

## 受けた指示

- `.workspace/plam-20260530-01.txt` 対応を継続し、Tools API の残存 JS source-of-truth 問題を小さく前進させる。
- リポジトリルールに従い、task md、検証、PR コメント、作業レポートを残す。

## 要件整理

- `apps/tools-api/src/local-tools-api.js` を手書き互換 JS ではなく TypeScript source 由来の generated mirror にする。
- 生成 drift を source gate で検出できるようにする。
- 既存の package export 互換 path は維持する。

## 検討・判断

- local fixture wrapper は小さく、Tools API の tool contract path と local RAG tools を接続する責務に限定できる。
- TS 正本では `toolContracts` から path handler map を作り、route path の重複定義を避けた。
- 生成物は no-install CI job でも動くように、relative import に `.js` を付与する方針にした。

## 実施作業

- `apps/tools-api/src/local-tools-api.ts` を追加した。
- `tools/generate-tools-local-runtime-mirror.js` を追加した。
- root `package.json` に `tools-api:local:generate` / `tools-api:local:check` を追加した。
- `tools/check-type-surface.js` に Tools API local mirror check を統合した。
- `apps/tools-api/src/local-tools-api.js` を生成物に更新した。
- `tools/source-js-allowlist.json` と `docs/ops/local-verification.md` を同期した。

## 成果物

- `apps/tools-api/src/local-tools-api.ts`
- `apps/tools-api/src/local-tools-api.js`
- `tools/generate-tools-local-runtime-mirror.js`
- `tools/check-type-surface.js`
- `tools/source-js-allowlist.json`
- `docs/ops/local-verification.md`
- `tasks/do/20260530-1620-tools-local-runtime-mirror.md`

## 検証

- `npm run tools-api:local:generate`: 成功
- `npm run tools-api:local:check`: 成功
- `npm run typecheck:source`: 成功
- `npm run check:no-src-js`: 成功
- `npm run check:static`: 成功
- `git diff --check`: 成功

## fit 評価

- `apps/tools-api/src/local-tools-api.js` を TS 正本から再生成可能にし、plan の JS source-of-truth 廃止方針に沿って前進した。
- local wrapper は `toolContracts` 由来の path map を使うため、tool path drift を起こしにくくした。

## 未対応・制約・リスク

- Tools API 本体の 1 tool = route/schema/usecase/policy 分割と production adapter 境界強化は後続タスクとして残る。
- GitHub Actions の再実行結果は push 後に確認する。
