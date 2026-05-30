# Chat read API coverage slice

- 状態: doing
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 17:40 JST

## 背景

`.workspace/plam-20260530-01.txt` は API operation coverage の planned marker を production-ready gate で 0 にする方針を示している。
Auth / LLM models / getMe slices 後も chat read 系 API は planned marker を持つが、local handler、OpenAPI schema、DSQL mapping、既存 local integration / web flow checks が揃っている。

## 目的

状態変更や event append を伴わない chat read 系 API 6件の coverage manifest を既存実装・検証実態に合わせ、API production coverage の planned marker を 35 件から 29 件へ減らす。

## 対象 API

- `listChatSessions`
- `getChatSession`
- `listChatParticipants`
- `listMessages`
- `listMessageEvents`
- `listFavorites`

## 受け入れ条件

- [x] 対象 API 6件の local fixture handler が存在する。
- [x] 対象 API 6件の DSQL mapping key が存在する。
- [x] chat/session/participant/message/favorite の read query が actor の参加者・所有者・ユーザー境界を確認する。
- [x] `packages/api-contract/src/implementation-coverage.ts` 上で対象 API 6件に planned marker が残らない。
- [x] generated coverage mirror が更新される。
- [x] `npm run implementation-coverage:generate` が成功する。
- [x] `npm run implementation-coverage:check` が成功する。
- [x] `npm run api:implementation:check` が成功し、planned marker 数が 29 件になる。
- [x] `npm run api:implementation:check:production` の失敗リストから対象 API 6件が消える。
- [x] `npm run test:integration:local` が成功する。
- [x] `npm run test:e2e:local` が成功する。
- [x] `npm run web:flow:check` が成功する。
- [x] `npm run perf:api:local` が成功する。
- [x] `npm run typecheck:source` が成功する。
- [x] `npm run check:static` が成功する。
- [x] `git diff --check` が成功する。
- [ ] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- [ ] GitHub Actions の PR check が成功する。

## 実施結果

- `packages/api-contract/src/implementation-coverage.ts` の対象 API 6件で aggregate unit/dsql smoke 検証を明示し、planned marker を外した。
- `packages/api-contract/src/implementation-coverage.js` を再生成した。
- `apps/api/src/local-api.ts` の local handler と `apps/api/src/repositories/dsql/apiRepository.ts` の DSQL mapping が対象 API 6件分存在することを確認した。
- DSQL query plan が `chat_participants` / `users` join による actor 境界を持つことを確認した。

## 検証

- [x] `npm run implementation-coverage:generate`
- [x] `npm run implementation-coverage:check`
- [x] `npm run api:implementation:check` (`29 planned markers`)
- [x] `npm run api:implementation:check:production` は失敗するが、失敗リストから対象 API 6件が消えた
- [x] `npm run test:integration:local`
- [x] `npm run test:e2e:local`
- [x] `npm run web:flow:check`
- [x] `npm run perf:api:local`
- [x] `npm run typecheck:source`
- [x] `npm run check:static`
- [x] `git diff --check`
