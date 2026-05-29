# Chat citation REST 復元境界

- 状態: do
- タスク種別: 機能追加
- 作成日時: 2026-05-29 19:53
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: #3

## 背景

Chat の citation は RAG 実行時に `citation_records` へ保存され、`chat.message.final_ready` event payload にも軽量情報が入っている。ただし、履歴再取得時の `listMessages` response には citation が含まれず、UI/docs では「引用本文の完全 REST 復元」が未接続として残っている。

## 目的

`listMessages` が参加者境界内で message ごとの `citations` を返し、Web の Citation Drawer が event payload だけでなく REST message history 由来の citation でも復元できるようにする。AppSync Events の実 subscribe、実ブラウザ E2E、実 Aurora DSQL 実行は未接続として残す。

## スコープ

- local store `listMessages` / `getChat`
- DSQL repository `listMessages` plan
- OpenAPI / Zod response schema / generated API client type
- Web `ChatMessage` 型、Message history、Citation Drawer
- source/local/docs gates

## 対象外

- citation full text/chunk body の AppSync Events payload 混入
- citation detail 専用 endpoint 追加
- 実 AppSync Events subscribe
- 実 Aurora DSQL SQL 実行
- 実ブラウザ E2E

## 受け入れ条件

- [ ] `listMessages` が各 message に `citations` array を返す。
- [ ] `citations` は参加者境界内でのみ返り、outsider は取得できない。
- [ ] DSQL `listMessages` plan が `citation_records` を message 単位に集約して返す。
- [ ] OpenAPI / Zod / generated API client type / Web type が `citations` を同期する。
- [ ] Citation Drawer が REST message history 由来の citation を表示でき、event payload 由来も維持する。
- [ ] UI/source gate/docs 上で citation REST 復元は接続済み範囲になり、実 AppSync subscribe / 実ブラウザ / 実 Aurora DSQL は未接続として残る。
- [ ] 選定した検証コマンドが pass する。

## 検証計画

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck:source`
- `npm run api-client:operation-types:check`
- `npm run api:openapi:check`
- `npm run web:flow:check`
- `npm run ui:check`
- `npm run web:a11y:check`
- `npm run test:integration:local`
- `npm run test:contract`
- `npm test`
- `npm run docs:check`
- `git diff --check`

## PR セルフレビュー観点

- citation は参加者境界を越えて漏れないこと。
- AppSync Events payload に回答本文や chunk 本文を混ぜない設計を弱めていないこと。
- schema/type/UI/docs が同期していること。
- benchmark 期待語句や dataset 固有分岐を実装へ入れていないこと。
