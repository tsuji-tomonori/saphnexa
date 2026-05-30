# Chat read API coverage slice 作業レポート

## 受けた指示

- `.workspace/plam-20260530-01.txt` 対応を継続し、API production coverage planned marker を減らす。
- リポジトリルールに従い、task md、検証、PR コメント、作業レポートを残す。

## 要件整理

- Auth / LLM models / getMe slices 後に残った planned marker 35 件から、状態変更を伴わない chat read API 6件を planned から外す。
- chat/session/participant/message/favorite の読み取り認可境界は弱めない。
- production-ready 全体はまだ残件があるため、未達を完了扱いにしない。

## 検討・判断

- 対象 API 6件は local fixture handler、OpenAPI schema、DSQL query plan が存在し、local integration / e2e / web flow / performance checks で継続検証されている。
- 状態変更 API ではないため domain event / audit は `not_required` のままとした。
- 個別 unit/dsql smoke 分割は未実施だが、既存の aggregate integration/static 検証が read boundary と DSQL mapping surface を確認しているため、coverage 上は aggregate として明示した。

## 実施作業

- `packages/api-contract/src/implementation-coverage.ts` の `listChatSessions` / `getChatSession` / `listChatParticipants` / `listMessages` / `listMessageEvents` / `listFavorites` から planned marker を外した。
- `npm run implementation-coverage:generate` で generated mirror を更新した。
- `apps/api/src/local-api.ts` の local handler、`apps/api/src/repositories/dsql/apiRepository.ts` の DSQL mapping と actor 境界を確認した。

## 成果物

- `packages/api-contract/src/implementation-coverage.ts`
- `packages/api-contract/src/implementation-coverage.js`
- `tasks/do/20260530-1740-chat-read-api-coverage-slice.md`

## 検証

- `npm run implementation-coverage:generate`: 成功
- `npm run implementation-coverage:check`: 成功
- `npm run api:implementation:check`: 成功、`29 planned markers`
- `npm run api:implementation:check:production`: 失敗。ただし失敗リストから対象 API 6件が消えた。
- `npm run test:integration:local`: 成功
- `npm run test:e2e:local`: 成功
- `npm run web:flow:check`: 成功
- `npm run perf:api:local`: 成功
- `npm run typecheck:source`: 成功
- `npm run check:static`: 成功
- `git diff --check`: 成功

## fit 評価

- API production coverage planned marker を 35 件から 29 件に減らし、既存の chat read 実装・検証実態と coverage manifest を同期した。
- 参加者境界・ユーザー境界を弱める実装変更はなく、固定 user fallback や mock product UI は追加していない。

## 未対応・制約・リスク

- `npm run api:implementation:check:production` は残り29件の planned marker で引き続き失敗する。
- 対象 API 6件の専用 unit test / 実 DSQL executor smoke は未分割で、現時点では aggregate 検証として扱っている。
- GitHub Actions の再実行結果は push 後に確認する。
