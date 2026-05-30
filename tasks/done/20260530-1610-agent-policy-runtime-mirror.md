# Agent policy runtime mirror generation

- 状態: done
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 16:10 JST

## 背景

`.workspace/plam-20260530-01.txt` は `apps/agent/src/rag-agent.js` を残存 JS source の廃止対象に含めている。
現状の `rag-agent.js` は local Node check 互換の手書き JS で、実ロジックの正本は `apps/agent/src/agent/retrievalPolicy.ts` にある。

## 目的

Agent policy 互換 export を TypeScript source-of-truth から生成される runtime mirror に変更し、手書き JS を減らす。

## 受け入れ条件

- `apps/agent/src/rag-agent.js` が `apps/agent/src/agent/retrievalPolicy.ts` から生成される。
- generator check が `npm run typecheck:source` または同等の source surface gate に含まれる。
- `tools/source-js-allowlist.json` の `apps/agent/src/rag-agent.js` 理由が generated mirror として更新される。
- `npm run agent:policy:generate` が成功する。
- `npm run agent:policy:check` が成功する。
- `npm run typecheck:source` が成功する。
- `npm run check:no-src-js` が成功する。
- `npm run check:static` が成功する。
- `git diff --check` が成功する。
- PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- GitHub Actions の PR check が成功する。

## docs 影響

- 外部仕様は変えない。
- 生成コマンドと gate の追加に合わせて `docs/ops/local-verification.md` に `agent:policy:check` を追記する。

## 実施結果

- `tools/generate-agent-policy-runtime-mirror.js` を追加し、`apps/agent/src/agent/retrievalPolicy.ts` から `apps/agent/src/rag-agent.js` を生成するようにした。
- root script に `agent:policy:generate` / `agent:policy:check` を追加した。
- `tools/check-type-surface.js` から generator check と policy token 同期を検査するようにした。
- `tools/source-js-allowlist.json` の `apps/agent/src/rag-agent.js` 理由を generated mirror に更新した。
- `docs/ops/local-verification.md` に Agent policy runtime mirror check を追記した。

## 検証

- [x] `npm run agent:policy:generate`
- [x] `npm run agent:policy:check`
- [x] `npm run typecheck:source`
- [x] `npm run check:no-src-js`
- [x] `npm run check:static`
- [x] `git diff --check`
- [x] PR 受け入れ条件確認コメント
- [x] PR セルフレビューコメント
- [x] GitHub Actions の PR check 成功

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582052168
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582054755

## CI

- PR checks: 2026-05-30 16:15 JST 時点で全 job pass
