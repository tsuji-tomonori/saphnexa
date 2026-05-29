# Chat answer cancel boundary 作業完了レポート

## 受けた指示

- `plan-20260529.txt` と `.workspace` の基本設計をもとに作業を継続する。
- `main` を pull/fetch してから作業する。
- リポジトリの Worktree Task PR Flow、task md、検証、PR 更新、作業レポートのルールに従う。

## 要件整理

- FR-CHAT-004 / API-17 の slice として、Chat UI から `cancelAnswerGeneration` を呼べる境界を追加する。
- owner または投稿者本人だけが対象 message/run をキャンセルでき、viewer / outsider は拒否されることを local/source gate で確認する。
- キャンセル後に run/message の canceled status と `chat.run.canceled` event を確認する。
- 実 AgentCore Runtime 停止、SQS event-publish、AppSync fan-out、streaming 中断、実 Aurora DSQL 実行、実ブラウザ E2E は今回の完了条件に含めない。

## 検討・判断

- API contract / route helper / OpenAPI schema は既存の `cancelAnswerGeneration` を利用し、未接続だった dispatch / repository / Web hook / UI を接続した。
- local fixture RAG は同期完了するため、専用の pending run fixture は追加せず、cancel request による run/message の canceled 遷移と event 追記の境界を検査した。
- Web UI は固定 message/run ID を置かず、直近 submit で得た `messageId`、active chat、CSRF token、mutation state だけを使う形にした。
- 未実装の実 runtime stop / SQS publish / AppSync fan-out / stream interruption は UI と docs に未接続として明示した。

## 実施作業

- `packages/domain` local store に `cancelAnswerGeneration` を追加。
- `apps/api` local API に `cancelAnswerGeneration` dispatch を追加。
- DSQL repository に participant / requester 境界付きの `chat_runs` / `chat_messages` cancel update と `chat_message_events` insert query plan を追加。
- Web hook に `apiPostOperation("cancelAnswerGeneration")` mutation を追加。
- Message history panel に回答生成キャンセル要求 action と正直な未接続 status を追加。
- `tools/check-web-flows.js`、`tools/check-ui-quality.js`、`tools/check-web-accessibility-report.js`、`tools/check-type-surface.js`、`docs/ops/local-verification.md` を更新。
- task md `tasks/do/20260529-1715-chat-answer-cancel-boundary.md` を作成・更新。

## 成果物

- Chat answer cancel の local/API/DSQL/Web/UI/docs/source gate 境界。
- local flow に owner cancel、viewer/outsider 拒否、canceled status、`chat.run.canceled` event 検証を追加。

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
- 未実施の実 AgentCore Runtime 停止、SQS event-publish、AppSync fan-out、streaming 中断、実ブラウザ E2E は実施済み扱いにしていない。

## 未対応・制約・リスク

- DSQL query plan は source gate 上の設計境界であり、実 Aurora DSQL driver 接続・実 SQL 実行証跡ではない。
- local fixture は同期完了するため、実 streaming run の途中停止や worker interruption は確認していない。
- CloudFront/Cognito 経由 HTTP、AppSync Events fan-out、SQS event-publish は別途検証が必要。
