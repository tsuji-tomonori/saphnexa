# Atomicity strict boundary cleanup

- 状態: doing
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 16:50 JST

## 背景

`npm run check:atomicity:strict` が以下で失敗している。

- `apps/web/src/pages/ChatPage.tsx` が `@saphnexa/api-client` を直接 import している。
- `apps/web/src/pages/ChatPage.tsx` の `refetch(` が direct `fetch(` として検出されている。
- `apps/agent/src/agent/ragAgent.ts` が `dsqlClient` を import している。

## 目的

Web page / Agent runtime の atomic dependency boundary を strict gate で通る状態にする。

## 受け入れ条件

- ChatPage が `@saphnexa/api-client` を直接 import しない。
- direct fetch 検査が `refetch(` を誤検出しない。
- Agent runtime が `dsqlClient` を直接 import せず、retrieval policy client boundary を使う。
- `npm run check:atomicity:strict` が成功する。
- `npm run typecheck:source` が成功する。
- `npm run check:static` が成功する。
- `git diff --check` が成功する。
- PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- GitHub Actions の PR check が成功する。

## 実施結果

- `issueWsTicket` 呼び出しを `useIssueWsTicket` hook に移し、ChatPage から API client direct import を除去した。
- `check-atomicity` の direct fetch 検査を `\bfetch(` に変更し、`refetch(` の誤検出を避けた。
- Agent の invocation policy client を `retrievalPolicyClient` boundary にリネームし、`ragAgent.ts` から `dsqlClient` import を除去した。
- `tools/check-type-surface.js` の required source list を新しい hook / client path に同期した。

## 検証

- [x] `npm run check:atomicity:strict`
- [x] `npm run typecheck:source`
- [x] `npm run check:static`
- [x] `git diff --check`
- [ ] PR 受け入れ条件確認コメント
- [ ] PR セルフレビューコメント
- [ ] GitHub Actions の PR check 成功
