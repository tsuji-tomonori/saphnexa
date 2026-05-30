# Agent policy runtime mirror generation 作業レポート

## 受けた指示

- `.workspace/plam-20260530-01.txt` 対応を継続し、Agent の残存 JS source-of-truth 問題を小さく前進させる。
- リポジトリルールに従い、task md、検証、PR コメント、作業レポートを残す。

## 要件整理

- `apps/agent/src/rag-agent.js` を手書き互換 JS ではなく TypeScript source 由来の generated mirror にする。
- 生成 drift を source gate で検出できるようにする。
- 既存の Node local test 互換 export は維持する。

## 検討・判断

- policy guard の正本は `apps/agent/src/agent/retrievalPolicy.ts` に既に存在する。
- `rag-agent.js` は `assertRetrievalPolicyNotRelaxed` の互換 export として使われているため、package export と test import は維持し、生成物だけを置き換える方針にした。
- `typescript.transpileModule` で type-only import と型注釈を落とし、runtime mirror の主要 policy token を assert する方針にした。

## 実施作業

- `tools/generate-agent-policy-runtime-mirror.js` を追加した。
- root `package.json` に `agent:policy:generate` / `agent:policy:check` を追加した。
- `tools/check-type-surface.js` に Agent policy mirror check を統合した。
- `apps/agent/src/rag-agent.js` を生成物に更新した。
- `tools/source-js-allowlist.json` と `docs/ops/local-verification.md` を同期した。

## 成果物

- `tools/generate-agent-policy-runtime-mirror.js`
- `apps/agent/src/rag-agent.js`
- `tools/check-type-surface.js`
- `tools/source-js-allowlist.json`
- `docs/ops/local-verification.md`
- `tasks/do/20260530-1610-agent-policy-runtime-mirror.md`

## 検証

- `npm run agent:policy:generate`: 成功
- `npm run agent:policy:check`: 成功
- `npm run typecheck:source`: 成功
- `npm run check:no-src-js`: 成功
- `npm run check:static`: 成功
- `git diff --check`: 成功

## fit 評価

- `apps/agent/src/rag-agent.js` を TS 正本から再生成可能にし、plan の JS source-of-truth 廃止方針に沿って前進した。
- 既存 local Node test の import path は維持したため、互換性を壊していない。

## 未対応・制約・リスク

- Agent 全体の pipeline 分割、Tools API client 経由強制、`apps/agent/src` からの JS 完全排除は後続タスクとして残る。
- GitHub Actions の再実行結果は push 後に確認する。
