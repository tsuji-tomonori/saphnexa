# Web realtime contract hardening

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-29 12:21 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- 参照:
  - `/home/t-tsuji/project/saphnexa/.workspace/plan-20260529.txt`
  - `/home/t-tsuji/project/saphnexa/.workspace/Saphnexa_基本設計書_v0.17_package.zip`

## 背景

`plan-20260529.txt` ではフロントエンドが assistant-ui / AppSync Events / Atomic Design の本実装へ届いていないことが課題として整理されている。
基本設計 v0.17 では React は AWS 実サービスドメインを保持せず、単一 CloudFront 配下の相対 `/event/realtime` で AppSync Events を購読し、WebSocket ticket は URL query ではなく接続認可 payload で使う方針になっている。

現状の `realtimeClient.ts` は endpoint env を受け取り、ticket/chat/message を URL query に載せ、通知受信後の REST 差分取得にもつながっていない。

## 目的

Web realtime client のブラウザ側契約を基本設計に近づける。
実 AppSync Events のクラウド接続完了ではなく、production UI 経路で相対 endpoint、ticket 非 query、通知後の REST refetch を担保する。

## スコープ

- `apps/web/src/lib/realtimeClient.ts`
- `apps/web/src/hooks/useMessageRealtime.ts`
- `apps/web/src/pages/ChatPage.tsx`
- 関連 source gate / local verification docs

## 実装方針

- endpoint 未指定時は同一 origin の `/event/realtime` を WebSocket URL に変換する。
- production client で `VITE_APPSYNC_EVENTS_URL` など AWS 実ドメイン env を要求しない。
- WebSocket URL の query へ ticket/chat/message を載せない。
- 接続後に ticket と channel を含む subscribe payload を送る。
- ticket API が返す `channels` を使い、UIで固定ユーザーIDや架空 channel を作らない。
- 通知受信時は `useMessageEvents` の Query を `refetch` し、取りこぼしを REST で復旧できる形へ寄せる。

## ドキュメント保守方針

- local verification docs に realtime source gate の検査範囲と、実 AppSync Events E2E は未実施であることを明記する。

## 受け入れ条件

- `realtimeClient.ts` が同一 origin の `/event/realtime` を default endpoint とし、AWS 実ドメイン env を必須にしないこと。
- WebSocket URL query に ticket、chat_id、message_id を入れないこと。
- subscribe payload に ticket と channel を含めること。
- ChatPage が `/api/ws-ticket` レスポンスの `channels` を `useMessageRealtime` へ渡すこと。
- 通知受信時に `useMessageEvents` の REST refetch が走る wiring になっていること。
- source gate が上記 contract を検査すること。
- production UI に fake event / fake channel / fake user を生成しないこと。

## 検証計画

- `npm run typecheck -w @saphnexa/web`
- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run build -w @saphnexa/web`
- `npm run docs:check`
- `git diff --check`

## PR レビュー観点

- React が実 AWS サービスドメインを保持していないこと。
- ticket が URL query に露出していないこと。
- 通知は本文データの代替ではなく REST 再取得のトリガになっていること。
- 実 AppSync Events E2E を完了扱いしていないこと。

## リスク・制約

- 実 AppSync Events のプロトコル詳細接続検証はこの slice では未実施。
- ブラウザE2Eではなく source/type/build gate での前進に限定する。

## 検証結果

- `npm run typecheck -w @saphnexa/web`: pass。
- `npm run web:flow:check`: pass。
- `npm run web:a11y:check`: pass。
- `npm run build -w @saphnexa/web`: pass。
- `npm run docs:check`: pass。
- `npm run typecheck`: pass。
- `git diff --check`: pass。
