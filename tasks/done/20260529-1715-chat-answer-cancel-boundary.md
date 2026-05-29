# Chat answer cancel boundary

## 背景

`.workspace` の基本設計 v0.17 では FR-CHAT-004 / API-17 として、一般ユーザーが生成中の回答をキャンセルでき、run と message event にキャンセル要求が反映されることが定義されている。
現行 PR #3 では `cancelAnswerGeneration` の API contract / route helper / OpenAPI schema は存在するが、local API dispatch、DSQL query plan、Web Chat UI からの操作境界は未接続である。

## 目的

Chat UI から選択中の回答生成 message にキャンセル要求を出す API/UI 境界を追加する。local/source gate では owner または投稿者本人だけが対象 message/run をキャンセルでき、viewer / outsider は拒否され、`chat.run.canceled` event と canceled status が確認できることを検査する。

## タスク種別

機能追加

## スコープ

- `packages/domain` local store と `apps/api` local API に `cancelAnswerGeneration` 境界を追加する。
- DSQL repository に `cancelAnswerGeneration` query plan を追加する。
- Web Chat に回答生成キャンセル操作を追加する。
- source/UI/web/docs/local flow gate を更新する。
- 実 AgentCore Runtime 停止、SQS event-publish、実 AppSync fan-out、streaming 中断、実 Aurora DSQL 実行は今回の対象外とする。

## 実装計画

1. local store に `cancelAnswerGeneration` を追加し、owner または requested_by_user_id 本人だけが対象 run/message を canceled にできるようにする。
2. local API に `cancelAnswerGeneration` dispatch を追加する。
3. DSQL repository に chat participant / run requester 境界付きの `chat_runs` / `chat_messages` update plan を追加する。
4. Web hook と Message history controls を追加し、mutation 後に messages/events query を invalidate する。
5. source/UI/web/docs gate と local flow を更新する。
6. 選定した検証コマンドを実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、回答生成キャンセルは route helper / generated operation helper と local/source gate で確認し、実 AgentCore Runtime 停止、SQS event-publish、AppSync fan-out、streaming 中断、実ブラウザ E2E は別途であることを追記する。

## 受け入れ条件

- [x] Web Chat が `cancelAnswerGeneration` route helper / generated operation helper を使う。
- [x] owner または投稿者本人だけが対象 message/run をキャンセルでき、viewer / outsider を拒否する。
- [x] local flow で canceled status と `chat.run.canceled` event を確認できる。
- [x] DSQL repository が `chat_runs` / `chat_messages` を認可境界付きで更新し、cancel event を追加する query plan を持つ。
- [x] UI/source/docs/local flow gate が回答生成キャンセル境界を検査する。
- [x] 選定した検証コマンドが pass し、実 AgentCore Runtime 停止、SQS event-publish、AppSync fan-out、streaming 中断、実ブラウザ E2E を実施済みに見せない。

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

- キャンセル操作が chat owner または投稿者本人の境界を越えていないこと。
- Web が固定 message/run ID や demo fallback を本番 UI に混ぜていないこと。
- 実 AgentCore Runtime 停止や AppSync fan-out を実装済みに見せていないこと。

## リスク

- この slice は local/source gate であり、実 AgentCore Runtime の停止、実 SQS publish、実 AppSync Events fan-out、実ブラウザ操作の証跡ではない。
- local store では同期 fixture RAG が即時完了するため、キャンセル可能状態を local API で人工的に保持する専用 pending run は作らず、既存 run の cancel transition 境界を検査する。

## 実施結果

- local store / local API に `cancelAnswerGeneration` dispatch を追加し、run/message の canceled 遷移と `chat.run.canceled` event 追記を追加した。
- DSQL repository に participant / requester 境界付きの cancel query plan を追加した。
- Web hook と Message history panel に `cancelAnswerGeneration` route helper / generated operation helper 経由のキャンセル要求を追加した。
- `docs/ops/local-verification.md`、UI/source/a11y/type/local flow gate に回答生成キャンセル境界を追加した。

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

done
