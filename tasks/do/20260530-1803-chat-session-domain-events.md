# Chat session domain events coverage slice

- 状態: doing
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 18:03 JST
- タスク種別: 機能追加

## 背景

`.workspace/plam-20260530-01.txt` は TypeScript source of truth と runtime mirror の atomicity を強め、API operation coverage の planned marker を production-ready gate で 0 に近づける方針を示している。
Admin/read slice 後も chat session の state-changing API 3件は DSQL mapping と audit append を持つが、`chat_session_events` への domain event append が未実装のため coverage manifest 上で planned marker が残っている。

## 目的

`createChatSession`、`updateChatSession`、`deleteChatSession` の DSQL query plan に `chat_session_events` append を追加し、既存 projection update と audit append に加えて domain event を同一 plan 内で記録する。
その上で coverage manifest と generated mirror を実装実態に合わせ、API production coverage の planned marker を 24 件から 21 件へ減らす。

## 対象 API

- `createChatSession`
- `updateChatSession`
- `deleteChatSession`

## 実施計画

1. `chat_session_events` の schema と lifecycle doc を確認する。
2. 対象 DSQL query plan に event append CTE を追加する。
3. `packages/api-contract/src/implementation-coverage.ts` の対象 API 3件から planned marker を外す。
4. generated coverage mirror を再生成する。
5. 変更範囲に見合う検証を実行し、production gate の残 planned marker を確認する。
6. 作業レポートを `reports/working/` に残し、commit / push / PR コメント / CI 確認まで行う。

## ドキュメントメンテナンス計画

- API shape、route、permission、OpenAPI schema は変更しないため durable docs の更新は不要と判断する。
- `docs/generated/db/lifecycle.md` は既に `chat_sessions` が `chat_session_events` から projector 更新される前提を記載しているため、今回は実装を既存 docs に合わせる。
- 一時的な作業記録は task md と `reports/working/` に残す。

## 受け入れ条件

- [ ] 対象 API 3件の DSQL query plan が `chat_session_events` に domain event を append する。
- [ ] 対象 API 3件の既存 owner / active participant 境界を弱めない。
- [ ] 対象 API 3件の existing audit append を維持する。
- [ ] `packages/api-contract/src/implementation-coverage.ts` 上で対象 API 3件に planned marker が残らない。
- [ ] generated coverage mirror が更新される。
- [ ] `npm run implementation-coverage:generate` が成功する。
- [ ] `npm run implementation-coverage:check` が成功する。
- [ ] `npm run api:implementation:check` が成功し、planned marker 数が 21 件になる。
- [ ] `npm run api:implementation:check:production` の失敗リストから対象 API 3件が消える。
- [ ] `npm run test:integration:local` が成功する。
- [ ] `npm run web:flow:check` が成功する。
- [ ] `npm run typecheck:source` が成功する。
- [ ] `npm run check:static` が成功する。
- [ ] `git diff --check` が成功する。
- [ ] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- [ ] GitHub Actions の PR check が成功する。

## PR レビュー観点

- `chat_session_events` append が既存 projection update と audit append を壊していないこと。
- `event_seq` が aggregate 単位で単調増加する形になっていること。
- owner / active participant の認可境界が SQL 上で維持されていること。
- coverage manifest が実装実態より過大な完了扱いになっていないこと。

## リスク

- 現時点では projection table の直接 update も残るため、完全な projector 化ではない。今回の scope は domain event append を追加して coverage planned marker を削減することに限定する。
- `chat_participant_events`、`chat_run_events`、`chat_message_lifecycle_events` などの他 event append は別 slice で対応する。
