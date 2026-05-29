# Chat 回答単位お気に入り UI 境界 作業完了レポート

## 受けた指示
- `main` を pull/fetch してから作業する。
- `.workspace/plan-20260529.txt` と基本設計をもとに、未接続の設計項目を前進させる。
- リポジトリルールに従い、task md、検証、PR コメント、作業レポートを残す。

## 要件整理
- 既存の `addFavorite` / `deleteFavorite` API 境界を使い、assistant 回答 message 単位のお気に入り登録・解除 UI を追加する。
- 参加者のみ対象 chat の回答をお気に入り登録できるようにする。
- favorite 対象 message は同一 chat の assistant message に限定する。
- 同一 user/chat/message の重複 favorite は新規 row を作らず既存 favorite を返す。
- docs/source/UI/a11y/local gate を、回答単位 favorite UI と重複排除の接続済み状態に同期する。

## 検討・判断
- 新規 route は追加せず、40 route contract を維持して既存 `addFavorite` / `deleteFavorite` の request body にある `message_id` を活用した。
- API local store と DSQL query plan の双方で、participant boundary、assistant message validation、existing favorite dedupe を同期した。
- 実ブラウザ E2E と実 Aurora DSQL SQL 実行は今回未接続のまま docs に残した。

## 実施作業
- `MessageHistoryPanel` に assistant 回答ごとの「回答お気に入り登録」「回答お気に入り解除」ボタンを追加した。
- `ChatPage` から favorite 一覧、追加 mutation、削除 mutation、mutation 中 state を `MessageHistoryPanel` に渡した。
- local domain store の `addFavorite` で、回答 favorite の chat_id 必須、assistant message 存在検証、重複 favorite 再利用を追加した。
- DSQL repository の `addFavorite` plan に `target_message`、`favorite_scope`、`existing_favorite`、`inserted_favorite` を追加した。
- integration/local flow、web flow source gate、UI quality、a11y、type surface gate を更新した。
- `docs/ops/local-verification.md` の favorite 項目を回答単位 UI と重複排除の接続済み状態へ更新した。

## 成果物
- `apps/web/src/features/chat/MessageHistoryPanel.tsx`
- `apps/web/src/pages/ChatPage.tsx`
- `packages/domain/src/store.js`
- `apps/api/src/repositories/dsql/apiRepository.ts`
- `tests/integration-local.test.js`
- `tools/check-web-flows.js`
- `tools/check-ui-quality.js`
- `tools/check-web-accessibility-report.js`
- `tools/check-type-surface.js`
- `docs/ops/local-verification.md`
- `tasks/do/20260529-2004-chat-message-favorite-ui.md`

## 検証
- `git fetch origin main`: 実施済み。
- `git rev-list --left-right --count origin/main...HEAD`: 作業開始時 `0 122`。
- `npm run typecheck -w @saphnexa/web`: pass。
- `npm run typecheck -w @saphnexa/api`: pass。
- `npm run typecheck:source`: pass。
- `npm run web:flow:check`: pass。
- `npm run ui:check`: pass。
- `npm run web:a11y:check`: pass。
- `npm run test:integration:local`: pass。
- `npm test`: pass。
- `npm run docs:check`: pass。
- `npm run test:contract`: pass。
- `npm run web:build:check`: pass。Vite の 500 kB chunk warning は出たが、build と output check は pass。
- `git diff --check`: pass。

## 指示への fit 評価
- main fetch 後に専用 worktree 上で実装し、未追跡・未コミット変更を元 worktree から混ぜていない。
- task md に受け入れ条件を置いたうえで、実装と検証を進めた。
- 未実施の実ブラウザ E2E と実 Aurora DSQL SQL 実行は、完了扱いにせず docs とレポートに残した。

## 未対応・制約・リスク
- 実ブラウザでのクリック操作 E2E は未実施。
- 実 Aurora DSQL に対する SQL 実行確認は未実施。
- `web:build:check` では既存の Vite chunk size warning が出ている。
