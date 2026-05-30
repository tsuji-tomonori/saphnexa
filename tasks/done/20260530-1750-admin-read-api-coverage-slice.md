# Admin read API coverage slice

- 状態: done
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 17:50 JST

## 背景

`.workspace/plam-20260530-01.txt` は API operation coverage の planned marker を production-ready gate で 0 にする方針を示している。
Chat read slice 後も admin/read 系 API は planned marker を持つが、下記5件は local handler、OpenAPI schema、DSQL mapping、既存 local integration / web flow / admin checks が揃っている。

## 目的

DSQL mapping が存在する admin/read 系 API 5件の coverage manifest を既存実装・検証実態に合わせ、API production coverage の planned marker を 29 件から 24 件へ減らす。

## 対象 API

- `getDocument`
- `getIngestionJob`
- `listEvaluationDatasets`
- `getEvaluationRun`
- `listPublishedArtifacts`

## 受け入れ条件

- [x] 対象 API 5件の local fixture handler が存在する。
- [x] 対象 API 5件の DSQL mapping key が存在する。
- [x] admin/read query が active admin actor 境界を確認する。
- [x] `listPublishedArtifacts` は一般ユーザー・匿名ユーザーを拒否する既存検証がある。
- [x] `packages/api-contract/src/implementation-coverage.ts` 上で対象 API 5件に planned marker が残らない。
- [x] generated coverage mirror が更新される。
- [x] `npm run implementation-coverage:generate` が成功する。
- [x] `npm run implementation-coverage:check` が成功する。
- [x] `npm run api:implementation:check` が成功し、planned marker 数が 24 件になる。
- [x] `npm run api:implementation:check:production` の失敗リストから対象 API 5件が消える。
- [x] `npm run test:integration:local` が成功する。
- [x] `npm run test:e2e:local` が成功する。
- [x] `npm run admin:workflow:check` が成功する。
- [x] `npm run web:flow:check` が成功する。
- [x] `npm run perf:api:local` が成功する。
- [x] `npm run typecheck:source` が成功する。
- [x] `npm run check:static` が成功する。
- [x] `git diff --check` が成功する。
- [x] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- [x] GitHub Actions の PR check が成功する。

## 実施結果

- `packages/api-contract/src/implementation-coverage.ts` の対象 API 5件で aggregate unit/dsql smoke 検証を明示し、planned marker を外した。
- `packages/api-contract/src/implementation-coverage.js` を再生成した。
- `apps/api/src/local-api.ts` の local handler と `apps/api/src/repositories/dsql/apiRepository.ts` の DSQL mapping が対象 API 5件分存在することを確認した。
- DSQL query plan が admin actor の `role = 'admin'` / active user 境界を持つことを確認した。

## 検証

- [x] `npm run implementation-coverage:generate`
- [x] `npm run implementation-coverage:check`
- [x] `npm run api:implementation:check` (`24 planned markers`)
- [x] `npm run api:implementation:check:production` は失敗するが、失敗リストから対象 API 5件が消えた
- [x] `npm run test:integration:local`
- [x] `npm run test:e2e:local`
- [x] `npm run admin:workflow:check`
- [x] `npm run web:flow:check`
- [x] `npm run perf:api:local`
- [x] `npm run typecheck:source`
- [x] `npm run check:static`
- [x] `git diff --check`
- [x] PR 受け入れ条件確認コメント
- [x] PR セルフレビューコメント
- [x] GitHub Actions の PR check 成功

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582335476
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582336009

## CI

- PR checks: 2026-05-30 17:55 JST 時点で全 job pass
