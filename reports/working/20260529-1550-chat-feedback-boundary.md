# Chat feedback boundary 作業完了レポート

## 受けた指示

- `.workspace` の基本設計と `plan-20260529.txt` に基づき Saphnexa 実装を進める。
- main を pull/fetch してから作業する。
- repository workflow に従い、task md、検証、作業レポート、PR 更新まで行う。

## 要件整理

- FR-U-005 / API-18 のうち、閲覧可能な回答へ高評価、低評価、コメントを登録する最小境界を実装する。
- Web は `createFeedback` route helper と generated operation helper を使う。
- local store/API はチャット参加者だけが対象 assistant message へ登録でき、未参加者を拒否する。
- DSQL query plan と DB metadata/shared type が `message_feedback` table と `feedback_id` を扱える。
- 実ブラウザ E2E、フィードバック一覧・取消、分析集計、実 Aurora DSQL 実行は今回の完了範囲に含めない。

## 検討・判断

- 既存 API contract には `createFeedback` があるため、contract 追加ではなく Web hook、local API、DSQL、DB metadata/type の接続を優先した。
- `message_feedback` は同一ユーザー・同一回答で 1 件に保つため、local store は既存 feedback を更新し、DSQL は `(tenant_id, chat_id, message_id, user_id)` の conflict update を使う query plan にした。
- API response は既存 OpenAPI schema に合わせて `feedback_id` を返すため、migration metadata と shared DB type に `feedback_id` を追加した。
- フィードバック保存時の local event として `chat.feedback.recorded` を domain event catalog に追加した。

## 実施作業

- `message_feedback` の `feedback_id` を migration metadata / DB shared type に追加した。
- `packages/domain` local store に `MessageFeedbackRecord` と `createFeedback` を追加した。
- `apps/api/src/local-api.js` に `createFeedback` dispatch を追加した。
- DSQL repository に `createFeedback` query plan を追加した。
- Web に `useCreateFeedback` と `FeedbackPanel` を追加し、`ChatPage` へ接続した。
- OpenAPI/Zod schema と generated API client operation types を feedback response に合わせて更新した。
- `tools/check-type-surface.js`、`tools/check-web-flows.js`、`tools/check-ui-quality.js`、`tools/check-web-accessibility-report.js` を更新した。
- `docs/ops/local-verification.md` に Chat feedback の local/source gate と未完了範囲を追記した。

## 成果物

- `apps/web/src/hooks/useCreateFeedback.ts`
- `apps/web/src/features/chat/FeedbackPanel.tsx`
- `apps/web/src/pages/ChatPage.tsx`
- `apps/api/src/local-api.js`
- `apps/api/src/repositories/dsql/apiRepository.ts`
- `packages/domain/src/store.js`
- `packages/domain/src/store-types.ts`
- `packages/domain/src/index.ts`
- `packages/db-schema/src/table-metadata.ts`
- `packages/db-types/src/index.ts`
- source/docs gate 更新一式

## 検証

- `npm run typecheck -w @saphnexa/db-types`: pass
- `npm run typecheck -w @saphnexa/api`: pass
- `npm run typecheck -w @saphnexa/web`: pass
- `npm run typecheck:source`: pass
- `npm run web:flow:check`: pass
- `npm run ui:check`: pass
- `npm run web:a11y:check`: pass
- `npm run api-client:operation-types:check`: pass
- `npm run docs:check`: pass
- `npm run web:build:check`: pass。Vite の 500 kB chunk warning は出たが、local build output gate は gzip 146400 bytes で pass。
- `npm run test:integration:local`: pass
- `npm run test:contract`: pass
- `npm test`: pass
- `git diff --check`: pass

## fit 評価

- 指示された基本設計の Chat feedback 境界を、既存 contract を活かして local/source gate で検査できる形まで進めた。
- main fetch 後の専用 worktree 上で作業し、元 worktree の未コミット変更は混ぜていない。
- 実施していない実ブラウザ E2E、実 Aurora DSQL、フィードバック一覧・取消・分析集計は完了扱いにしていない。

## 未対応・制約・リスク

- フィードバック一覧、取消、分析集計 UI は未実装。
- DSQL SQL は query plan/source gate までで、実 Aurora DSQL executor による実行確認は未実施。
- CloudFront/Cognito 経由の実 HTTP、CSRF cookie integration、AWS dev/UAT 証跡は未実施。
