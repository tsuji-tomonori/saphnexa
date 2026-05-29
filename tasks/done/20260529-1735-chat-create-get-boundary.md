# Chat create/get boundary

## 背景

`.workspace` の基本設計 v0.17 では FR-U-001 / API-6 として、一般ユーザーが `/chat` から新規チャットを開始でき、作成者が owner 参加者として登録されることが定義されている。
また API-7 として、参加者だけがチャット詳細、参加者、メッセージを取得できることが定義されている。
現行 PR #3 では local API と API client route helper は存在するが、DSQL query plan と Web Chat UI からの新規チャット開始境界が未接続である。

## 目的

Chat UI から新規チャットを作成できる API/UI 境界を追加し、DSQL repository に `createChatSession` / `getChatSession` query plan を追加する。local/source gate では、作成者が owner 参加者として登録され、参加者だけが detail を取得できることを確認する。

## タスク種別

機能追加

## スコープ

- DSQL repository に `createChatSession` / `getChatSession` query plan を追加する。
- Web Chat sidebar に新規チャット作成フォームを追加する。
- Web hook に `useCreateChatSession` を追加する。
- source/UI/web/docs/local flow gate を更新する。
- 最初の質問送信時の自動チャット作成、`/chat/:chat_id` routing、実 chat event table append、SQS event-publish、実 Aurora DSQL 実行は今回の対象外とする。

## 実装計画

1. DSQL repository に active actor 限定の chat session 作成と owner participant 作成 query plan を追加する。
2. DSQL repository に active participant 限定の chat detail query plan を追加する。
3. Web hook に `createChatSession` route helper / generated operation helper mutation を追加する。
4. Chat sidebar に React Hook Form + Zod の新規チャット作成フォームを追加し、作成後に選択する。
5. source/UI/web/docs gate と local flow を更新する。
6. 選定した検証コマンドを実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Chat 新規作成と詳細取得は route helper / generated operation helper、local/source gate、DSQL query plan で確認し、最初の質問送信時の自動チャット作成、`/chat/:chat_id` routing、chat event table append、SQS event-publish、実ブラウザ E2E は別途であることを追記する。

## 受け入れ条件

- [x] Web Chat が `createChatSession` route helper / generated operation helper を使う。
- [x] 新規チャット作成後に作成者が owner 参加者として登録され、作成したチャットを選択できる。
- [x] `getChatSession` の DSQL query plan が参加者だけに detail、participants、messages を返す。
- [x] DSQL repository が `chat_sessions` / `chat_participants` を作成し、`chat_sessions` detail を参加者境界付きで取得する。
- [x] UI/source/docs/local flow gate が Chat create/get 境界を検査する。
- [x] 選定した検証コマンドが pass し、最初の質問送信時の自動チャット作成、`/chat/:chat_id` routing、chat event table append、SQS event-publish、実ブラウザ E2E を実施済みに見せない。

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

- 新規チャット作成が認証済み actor の tenant/user に閉じていること。
- Chat detail が参加者境界を越えていないこと。
- Web が固定 chat ID や fake title を本番 fallback として表示していないこと。
- chat event table append や SQS event-publish を実装済みに見せていないこと。

## リスク

- この slice は local/source gate であり、実 Aurora DSQL 実行、実 browser routing、実 SQS publish の証跡ではない。
- `/chat/:chat_id` routing と最初の質問送信時の自動チャット作成は別 slice とする。

## 実施結果

- DSQL repository に `createChatSession` / `getChatSession` query plan を追加した。
- Web hook に `useCreateChatSession` を追加し、`apiPostOperation("createChatSession")` と route helper に接続した。
- Chat sidebar に React Hook Form + Zod の新規チャット作成フォームを追加し、作成後に作成 chat を選択するようにした。
- `docs/ops/local-verification.md`、UI/source/a11y/type/local flow gate に Chat create/get 境界を追加した。

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
