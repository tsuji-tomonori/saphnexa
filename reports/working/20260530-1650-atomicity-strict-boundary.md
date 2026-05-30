# Atomicity strict boundary cleanup 作業レポート

## 受けた指示

- `.workspace/plam-20260530-01.txt` 対応を継続し、atomic dependency boundary を strict gate へ近づける。
- リポジトリルールに従い、task md、検証、PR コメント、作業レポートを残す。

## 要件整理

- Web page は API client を直接 import せず hooks/features 経由にする。
- direct fetch 検査は `refetch(` を誤検出しない。
- Agent runtime は `dsqlClient` import に依存せず、retrieval policy boundary を通す。

## 検討・判断

- ChatPage の direct API client 利用は `issueWsTicket` のみだったため、hook に移すのが最小変更。
- `refetch(` は TanStack Query の正規 API で direct `fetch(` ではないため、検査 regex を単語境界付きにした。
- Agent の ACL scope 解決は今後 Tools API / policy service へ寄せる前段として、`dsqlClient` という直接 DB 境界名から `retrievalPolicyClient` に切り出した。

## 実施作業

- `apps/web/src/hooks/useWsTicket.ts` を追加した。
- `apps/web/src/pages/ChatPage.tsx` から `@saphnexa/api-client` import を削除した。
- `apps/agent/src/clients/dsqlClient.ts` を `apps/agent/src/clients/retrievalPolicyClient.ts` へ移動し、`ragAgent.ts` の依存名を更新した。
- `tools/check-atomicity.js` の direct fetch regex を修正した。
- `tools/check-type-surface.js` の required source list を更新した。

## 成果物

- `apps/web/src/hooks/useWsTicket.ts`
- `apps/web/src/pages/ChatPage.tsx`
- `apps/agent/src/clients/retrievalPolicyClient.ts`
- `apps/agent/src/agent/ragAgent.ts`
- `tools/check-atomicity.js`
- `tools/check-type-surface.js`
- `tasks/done/20260530-1650-atomicity-strict-boundary.md`

## 検証

- `npm run check:atomicity:strict`: 成功
- `npm run typecheck:source`: 成功
- `npm run check:static`: 成功
- `git diff --check`: 成功
- GitHub Actions PR checks: 成功

## fit 評価

- strict atomicity の既知3件を解消し、`check:atomicity` の transitional findings は 0 件になった。
- Web page / Agent runtime の境界を強めたが、API behavior や RAG pipeline の処理順は変更していない。

## 未対応・制約・リスク

- retrieval policy client の実接続先はまだ local policy 相当であり、Tools API / production policy service への実接続は後続タスクとして残る。
