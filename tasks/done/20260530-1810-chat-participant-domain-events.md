# Chat participant domain events coverage slice

- 状態: done
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 18:10 JST
- タスク種別: 機能追加

## 背景

Chat session domain event slice 後も `addChatParticipant`、`updateChatParticipant`、`removeChatParticipant` は coverage manifest 上で `domainEvent: planned` を持つ。
これらは DSQL mapping を持つが、`chat_participant_events` append が未実装であり、coverage 上の audit 実装状態も DSQL plan 内で明示する必要がある。

## 目的

対象 API 3件の DSQL query plan に `chat_participant_events` append と `audit_events` append を追加し、既存 owner / active participant 境界を維持したまま coverage planned marker を 21 件から 18 件へ減らす。

## 対象 API

- `addChatParticipant`
- `updateChatParticipant`
- `removeChatParticipant`

## 実施計画

1. `chat_participant_events` の schema と既存 participant DSQL mapping を確認する。
2. 対象 DSQL query plan に event append CTE と audit append CTE を追加する。
3. `packages/api-contract/src/implementation-coverage.ts` の対象 API 3件から planned marker を外す。
4. generated coverage mirror を再生成する。
5. coverage / local integration / static checks を実行する。
6. 作業レポート、commit / push、PR コメント、CI 確認、task done 移動まで実施する。

## ドキュメントメンテナンス計画

- API shape、route、permission、OpenAPI schema は変更しないため durable docs の更新は不要と判断する。
- `docs/generated/db/lifecycle.md` は既に `chat_participants` が `chat_participant_events` から projector 更新される前提を記載しているため、今回は実装を既存 docs に合わせる。
- 一時的な作業記録は task md と `reports/working/` に残す。

## 受け入れ条件

- [x] 対象 API 3件の DSQL query plan が `chat_participant_events` に domain event を append する。
- [x] 対象 API 3件の DSQL query plan が `audit_events` に audit event を append する。
- [x] 対象 API 3件の既存 owner / active participant 境界を弱めない。
- [x] `packages/api-contract/src/implementation-coverage.ts` 上で対象 API 3件に planned marker が残らない。
- [x] generated coverage mirror が更新される。
- [x] `npm run implementation-coverage:generate` が成功する。
- [x] `npm run implementation-coverage:check` が成功する。
- [x] `npm run api:implementation:check` が成功し、planned marker 数が 18 件になる。
- [x] `npm run api:implementation:check:production` の失敗リストから対象 API 3件が消える。
- [x] `npm run test:integration:local` が成功する。
- [x] `npm run web:flow:check` が成功する。
- [x] `npm run typecheck:source` が成功する。
- [x] `npm run check:static` が成功する。
- [x] `git diff --check` が成功する。
- [x] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- [x] GitHub Actions の PR check が成功する。

## PR レビュー観点

- `chat_participant_events` append が既存 upsert / update / remove の返却行を壊していないこと。
- owner / active participant の認可境界が SQL 上で維持されていること。
- `updateChatParticipant` の owner transfer 時に、変更された participant row ごとに event / audit が残ること。
- coverage manifest が実装実態より過大な完了扱いになっていないこと。

## リスク

- 現時点では projection table の直接 update も残るため、完全な projector 化ではない。今回の scope は participant domain event と audit append の追加に限定する。
- message / run / feedback / favorite / admin write 系の planned marker は別 slice で対応する。

## 実施結果

- `apps/api/src/repositories/dsql/apiRepository.ts` の `addChatParticipant`、`updateChatParticipant`、`removeChatParticipant` に `chat_participant_events` append CTE を追加した。
- 同 3 operation に `audit_events` append CTE を追加した。
- 既存の owner / active participant 境界は維持した。
- `packages/api-contract/src/implementation-coverage.ts` と generated mirror から対象 API 3件の planned marker を外した。
- API implementation coverage は 21 planned markers から 18 planned markers へ減少した。

## 検証

- [x] `npm run implementation-coverage:generate`
- [x] `npm run implementation-coverage:check`
- [x] `npm run api:implementation:check` (`40 operations, 18 planned markers`)
- [x] `npm run api:implementation:check:production` は失敗するが、失敗リストから対象 API 3件が消えた
- [x] `npm run test:integration:local`
- [x] `npm run web:flow:check`
- [x] `npm run typecheck:source`
- [x] `npm run check:static`
- [x] `git diff --check`
- [x] PR 受け入れ条件確認コメント
- [x] PR セルフレビューコメント
- [x] GitHub Actions の PR check 成功

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582392181
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582392843

## CI

- PR checks: 2026-05-30 18:16 JST 時点で全 job pass
