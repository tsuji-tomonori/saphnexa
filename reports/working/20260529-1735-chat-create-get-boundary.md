# Chat create/get boundary 作業完了レポート

## 受けた指示

- `plan-20260529.txt` と `.workspace` の基本設計をもとに作業を継続する。
- `main` を pull/fetch してから作業する。
- リポジトリの Worktree Task PR Flow、task md、検証、PR 更新、作業レポートのルールに従う。

## 要件整理

- FR-U-001 / API-6 の slice として、Chat UI から `createChatSession` を呼べる境界を追加する。
- API-7 の slice として、DSQL repository に参加者限定の `getChatSession` detail query plan を追加する。
- 新規チャット作成後に作成者が owner 参加者として登録され、Web で作成 chat を選択できることを source/local gate で確認する。
- 最初の質問送信時の自動チャット作成、`/chat/:chat_id` routing、chat event table append、SQS event-publish、実 Aurora DSQL 実行、実ブラウザ E2E は今回の完了条件に含めない。

## 検討・判断

- local store / local API は既に `createChatSession` / `getChatSession` を持つため、未接続だった DSQL query plan と Web UI を接続した。
- DSQL `createChatSession` は active user から `chat_sessions` を作成し、同じ CTE 内で owner participant を登録する形にした。
- DSQL `getChatSession` は active participant 境界で chat detail、active participants、messages をまとめて返す source-level plan とした。
- Web UI は固定 chat ID や demo fallback を置かず、ユーザー入力、CSRF token、mutation response の chat ID だけを使う形にした。
- 未実装の routing / event append / SQS publish は UI と docs に未接続として明示した。

## 実施作業

- DSQL repository に `createChatSession` / `getChatSession` query plan を追加。
- Web hook に `useCreateChatSession` と `apiPostOperation("createChatSession")` mutation を追加。
- Chat sidebar に React Hook Form + Zod の新規チャット作成フォームを追加。
- 作成後に `setSelectedChatId(created.chat.chat_id)` で作成 chat を選択する接続を追加。
- `tools/check-web-flows.js`、`tools/check-ui-quality.js`、`tools/check-web-accessibility-report.js`、`tools/check-type-surface.js`、`docs/ops/local-verification.md` を更新。
- task md `tasks/do/20260529-1735-chat-create-get-boundary.md` を作成・更新。

## 成果物

- Chat create/get の DSQL/Web/UI/docs/source gate 境界。
- local flow に created chat detail、owner participant、outsider detail 拒否検証を追加。

## 検証

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

## fit 評価

- 受け入れ条件は local/source gate の範囲で満たした。
- 未実施の最初の質問送信時の自動チャット作成、`/chat/:chat_id` routing、chat event table append、SQS event-publish、実ブラウザ E2E は実施済み扱いにしていない。

## 未対応・制約・リスク

- DSQL query plan は source gate 上の設計境界であり、実 Aurora DSQL driver 接続・実 SQL 実行証跡ではない。
- `/chat/:chat_id` routing と URL 同期は別途対応が必要。
- chat event table append と SQS event-publish は別途実装・検証が必要。
