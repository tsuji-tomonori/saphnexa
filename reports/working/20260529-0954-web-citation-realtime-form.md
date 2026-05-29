# Web citation realtime form 作業レポート

## 受けた指示

- `.workspace` の基本設計と `plan-20260529.txt` をもとに、TypeScript framework 実装をさらに進める。
- main を fetch してから作業する。
- 未実施検証や未接続 runtime を実施済みとして書かない。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | MessageComposer が React Hook Form + Zod validation を使う | 対応 |
| R2 | Chat UI が events payload 由来の Citation Drawer を持つ | 対応 |
| R3 | Web realtime client boundary が fake event を返さない | 対応 |
| R4 | Web/UI/type checks が pass する | 対応 |
| R5 | AppSync Events 実接続と assistant-ui streaming 実ブラウザ挙動を完了扱いにしない | 対応 |

## 検討・判断の要約

- Citation Drawer は固定値ではなく、`chat.message.final_ready` event の `payload_json.citations` から抽出する形にした。
- local API の final event payload には citation count だけが入っていたため、本文を含まない citation metadata を payload に追加した。
- realtime client は `VITE_APPSYNC_EVENTS_URL` が未設定の場合に no-op disconnect を返し、架空 event は生成しない設計にした。
- MessageComposer は React Hook Form + Zod resolver を使い、empty question を disabled/error state として扱う。

## 実施作業

- `react-hook-form` と `@hookform/resolvers` を `@saphnexa/web` に追加した。
- `packages/ui/src/organisms/CitationDrawer.tsx` と barrel export を追加した。
- `apps/web/src/features/chat/CitationDrawerPanel.tsx` を追加し、events payload から citation metadata を抽出した。
- `apps/web/src/lib/realtimeClient.ts` と `apps/web/src/hooks/useMessageRealtime.ts` を追加した。
- `apps/web/src/features/chat/MessageComposer.tsx` を React Hook Form + Zod validation に更新した。
- `apps/web/src/pages/ChatPage.tsx` で realtime hook、ws ticket 発行、citation drawer を接続した。
- Web/UI static gates と `docs/ops/local-verification.md` を更新した。

## 検証結果

- `npm install react-hook-form@^7.53.0 @hookform/resolvers@^3.9.0 -w @saphnexa/web`: pass。
- `npm run typecheck`: pass。
- `npm run ui:check`: pass。
- `npm run web:flow:check`: pass。
- `npm run web:a11y:check`: pass。
- `npm run docs:check`: pass。
- `git diff --check`: pass。

## 成果物

| 成果物 | 内容 |
|---|---|
| `apps/web/src/features/chat/MessageComposer.tsx` | React Hook Form + Zod validation |
| `apps/web/src/features/chat/CitationDrawerPanel.tsx` | events payload 由来の citation drawer |
| `apps/web/src/lib/realtimeClient.ts` | AppSync Events / WebSocket client boundary |
| `apps/web/src/hooks/useMessageRealtime.ts` | realtime hook |
| `packages/ui/src/organisms/CitationDrawer.tsx` | 共通 UI organism |

## Fit 評価

総合fit: 4.5 / 5.0（約90%）

理由: plan の Citation Drawer、React Hook Form + Zod、realtime client boundary を前進させた。AppSync Events 実 subscribe、assistant-ui streaming の実ブラウザ確認、Vite production build は未実施のため満点ではない。

## 未対応・制約・リスク

- `VITE_APPSYNC_EVENTS_URL` を使った実 AppSync Events subscribe は未実施。
- assistant-ui streaming の実ブラウザ挙動は未検証。
- Citation source の PDF page jump は未実装。
