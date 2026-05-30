# Chat message event coverage slice

- 状態: done
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 18:40 JST
- 完了: 2026-05-30 18:47 JST
- タスク種別: 機能追加

## 背景

WebSocket ticket DSQL slice 後も `cancelAnswerGeneration`、`createFeedback` は coverage manifest 上で `domainEvent: planned` を持つ。
`cancelAnswerGeneration` は DSQL mapping 内で `chat_message_events` へ表示用イベントを出しているが、lifecycle doc が示す `chat_run_events` / `chat_message_lifecycle_events` への domain event append が不足している。
`createFeedback` は local store が `chat.feedback.recorded` を message event として記録している一方、DSQL mapping は `message_feedback` row だけを upsert している。

## 目的

対象 API 2件の DSQL query plan に不足している domain event append を追加し、既存の reader / owner / requester 境界を維持したまま coverage planned marker を 13 件から 11 件へ減らす。

## 対象 API

- `cancelAnswerGeneration`
- `createFeedback`

## 実施計画

1. `chat_run_events` / `chat_message_lifecycle_events` schema と local store の event behavior を確認する。
2. `cancelAnswerGeneration` に `chat_run_events` と `chat_message_lifecycle_events` append を追加する。
3. `createFeedback` に `chat_message_lifecycle_events` と `chat_message_events` append を追加する。
4. `packages/api-contract/src/implementation-coverage.ts` の対象 API 2件から planned marker を外す。
5. generated coverage mirror を再生成し、検証を実行する。
6. 作業レポート、commit / push、PR コメント、CI 確認、task done 移動まで実施する。

## ドキュメントメンテナンス計画

- API shape、route、permission、OpenAPI schema は変更しないため durable docs の更新は不要と判断する。
- `docs/generated/db/lifecycle.md` は既に message / run lifecycle event の前提を記載しているため、今回は実装を既存 docs に合わせる。
- 一時的な作業記録は task md と `reports/working/` に残す。

## 受け入れ条件

- [x] `cancelAnswerGeneration` の DSQL query plan が `chat_run_events` に domain event を append する。
- [x] `cancelAnswerGeneration` の DSQL query plan が `chat_message_lifecycle_events` に domain event を append する。
- [x] `createFeedback` の DSQL query plan が `chat_message_lifecycle_events` と `chat_message_events` に feedback event を append する。
- [x] 対象 API 2件の既存 reader / owner / requester 境界を弱めない。
- [x] `packages/api-contract/src/implementation-coverage.ts` 上で対象 API 2件に planned marker が残らない。
- [x] generated coverage mirror が更新される。
- [x] `npm run implementation-coverage:generate` が成功する。
- [x] `npm run implementation-coverage:check` が成功する。
- [x] `npm run api:implementation:check` が成功し、planned marker 数が 11 件になる。
- [x] `npm run api:implementation:check:production` の失敗リストから対象 API 2件が消える。
- [x] `npm run test:integration:local` が成功する。
- [x] `npm run web:flow:check` が成功する。
- [x] `npm run typecheck:source` が成功する。
- [x] `npm run check:static` が成功する。
- [x] `git diff --check` が成功する。
- [x] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- [x] GitHub Actions の PR check が成功する。

## 実施結果

- 実装 commit: `1575021`
- 作業レポート: `reports/working/20260530-1840-chat-message-event-coverage.md`
- PR 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582464487
- PR セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582465993
- GitHub Actions: `gh pr checks 6 --watch --interval 10` で pass を確認。

## 検証結果

- `npm run implementation-coverage:generate`: pass
- `npm run implementation-coverage:check`: pass
- `npm run api:implementation:check`: pass（40 operations, 11 planned markers）
- `npm run api:implementation:check:production`: expected fail。失敗リストは `submitQuestion`, `startUserImport`, `getUserImport`, `createDocument`, `createDocumentVersion`, `activateDocumentVersion`, `updateDocumentAcl`, `suspendDocument`, `retryIngestionJob`, `startEvaluationRun`, `issueArtifactAccessCookie` の 11 件で、対象 API 2件は消えている。
- `npm run test:integration:local`: pass
- `npm run web:flow:check`: pass
- `npm run typecheck:source`: pass
- `npm run check:static`: pass
- `git diff --check`: pass

## PR レビュー観点

- event append が既存 response shape を壊していないこと。
- message event sequence が既存 `chat_message_events` の最大値 + 1 で継続すること。
- reader / owner / requester 境界が SQL 上で維持されていること。
- coverage manifest が実装実態より過大な完了扱いになっていないこと。

## リスク

- projection table への直接 update / insert も残るため、完全な projector 化ではない。今回の scope は domain event append の追加に限定する。
- `submitQuestion` の完全な answer generation DSQL mapping は別 slice で対応する。
