# Chat participants list boundary

## 背景

`.workspace` の基本設計では FR-HIST-004 と API-10 として、一般ユーザーが共有チャットの参加者、ロール、共有日時、共有者を確認できることが定義されている。
現行 PR #3 では `listChatParticipants` の API contract / route helper / OpenAPI schema は存在するが、local API dispatch、DSQL query plan、Web Chat UI からの表示境界はまだ未接続である。

## 目的

Chat UI から現在のチャット参加者一覧を表示できる API/UI 境界を追加する。local/source gate では参加者だけが対象チャットの参加者一覧を取得でき、未参加者は拒否されることを確認する。

## タスク種別

機能追加

## スコープ

- `packages/domain` local store と `apps/api` local API に `listParticipants` / `listChatParticipants` を追加する。
- DSQL repository に `listChatParticipants` query plan を追加する。
- Web Chat に `useChatParticipants` hook と参加者一覧 panel を追加する。
- source/UI/web/docs/local flow gate を更新する。
- 参加者追加・削除・ロール変更 UI、実ブラウザ E2E、実 Aurora DSQL 実行、実 AppSync Events 通知は今回の対象外とする。

## 実装計画

1. local store に `listParticipants` を追加し、`requireReader` で参加者境界を確認する。
2. local API に `listChatParticipants` dispatch を追加する。
3. DSQL repository に active participant 限定の `listChatParticipants` plan を追加する。
4. Web hook と Chat participants panel を追加し、`ChatPage` の active chat に接続する。
5. source/UI/web/docs gate と local flow を更新する。
6. 選定した検証コマンドを実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Chat participants list は route helper / generated operation helper と local/source gate で確認し、共有操作 UI と実ブラウザ E2E は別途であることを追記する。

## 受け入れ条件

- [x] Web Chat が `listChatParticipants` route helper / generated operation helper を使う。
- [x] local store/API が参加者だけ対象チャットの参加者一覧を取得でき、未参加者を拒否する。
- [x] DSQL repository が `chat_participants` table を参加者境界付きで扱う。
- [x] UI/source/docs/local flow gate が Chat participants list 境界を検査する。
- [x] 選定した検証コマンドが pass し、共有操作 UI や実ブラウザ E2E を実施済みに見せない。

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

- 参加者一覧取得がチャット参加者境界を越えていないこと。
- Web が API response / query state 由来で表示し、固定ユーザーや fake participant を表示していないこと。
- 共有操作 UI、ロール変更 UI、削除 UI を実装済みに見せていないこと。

## リスク

- この slice は local/source gate であり、実ブラウザ操作や CloudFront/Cognito 経由 HTTP の証跡ではない。
- 共有操作 UI は対象外であり、参加者一覧表示境界に絞る。

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

## 状態

in_progress
