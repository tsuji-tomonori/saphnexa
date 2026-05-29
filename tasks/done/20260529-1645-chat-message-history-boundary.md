# Chat message history boundary

## 背景

`.workspace` の基本設計では FR-U-002 / FR-HIST-002 / API-14 として、一般ユーザーが既存チャットを再開し、過去のメッセージ、回答、引用を再表示できることが定義されている。
現行 PR #3 では `listMessages` の API contract / route helper / OpenAPI schema は存在するが、local API dispatch、DSQL query plan、Web Chat UI からの表示境界はまだ未接続である。

## 目的

Chat UI から現在のチャットの過去メッセージ一覧を表示できる API/UI 境界を追加する。local/source gate では参加者だけが対象チャットのメッセージ一覧を取得でき、未参加者は拒否されることを確認する。

## タスク種別

機能追加

## スコープ

- `packages/domain` local store と `apps/api` local API に `listMessages` を追加する。
- DSQL repository に `listMessages` query plan を追加する。
- Web Chat に `useChatMessages` hook とメッセージ履歴 panel を追加する。
- source/UI/web/docs/local flow gate を更新する。
- メッセージ paging cursor、回答単位の feedback state 復元、引用本文の完全 REST 復元、実ブラウザ E2E、実 Aurora DSQL 実行は今回の対象外とする。

## 実装計画

1. local store に `listMessages` を追加し、`requireReader` で参加者境界を確認する。
2. local API に `listMessages` dispatch を追加する。
3. DSQL repository に active participant 限定の `listMessages` plan を追加する。
4. Web hook と Chat message history panel を追加し、`ChatPage` の active chat に接続する。
5. source/UI/web/docs gate と local flow を更新する。
6. 選定した検証コマンドを実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Chat message history は route helper / generated operation helper と local/source gate で確認し、paging cursor、feedback state 復元、引用本文の完全 REST 復元、実ブラウザ E2E は別途であることを追記する。

## 受け入れ条件

- [x] Web Chat が `listMessages` route helper / generated operation helper を使う。
- [x] local store/API が参加者だけ対象チャットのメッセージ一覧を取得でき、未参加者を拒否する。
- [x] DSQL repository が `chat_messages` table を参加者境界付きで扱う。
- [x] UI/source/docs/local flow gate が Chat message history 境界を検査する。
- [x] 選定した検証コマンドが pass し、paging cursor、feedback state 復元、引用本文の完全 REST 復元、実ブラウザ E2E を実施済みに見せない。

## 検証計画

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck -w @saphnexa/web`
- `npm run api-client:operation-types:check`
- `npm run ui:check`
- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run typecheck:source`
- `npm run docs:check`
- `npm run web:build:check`
- `npm run test:integration:local`
- `npm run test:contract`
- `npm test`
- `git diff --check`

## PR レビュー観点

- メッセージ一覧取得がチャット参加者境界を越えていないこと。
- Web が API response / query state 由来で表示し、固定メッセージや fake history を表示していないこと。
- paging cursor、feedback state 復元、引用本文の完全 REST 復元を実装済みに見せていないこと。

## リスク

- この slice は local/source gate であり、実ブラウザ操作や CloudFront/Cognito 経由 HTTP の証跡ではない。
- 引用の詳細表示は既存 events payload 由来の Citation Drawer に依存し、メッセージ一覧 API で引用本文を完全復元する範囲ではない。

## 検証結果

- pass: `npm run typecheck -w @saphnexa/api`
- pass: `npm run typecheck -w @saphnexa/web`
- pass: `npm run api-client:operation-types:check`
- pass: `npm run ui:check`
- pass: `npm run web:flow:check`
- pass: `npm run web:a11y:check`
- pass: `npm run typecheck:source`
- pass: `npm run docs:check`
- pass: `npm run web:build:check`
- pass: `npm run test:integration:local`
- pass: `npm run test:contract`
- pass: `npm test`
- pass: `git diff --check`

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4572246766
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4572248943

## 状態

done
