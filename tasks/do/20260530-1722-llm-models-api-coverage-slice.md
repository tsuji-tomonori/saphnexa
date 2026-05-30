# LLM models API coverage slice

- 状態: doing
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 17:22 JST

## 背景

`.workspace/plam-20260530-01.txt` は API operation coverage の planned marker を production-ready gate で 0 にする方針を示している。
Auth API slice 後も `listLlmModels` は planned marker を持つが、local handler、DSQL mapping、OpenAPI schema、既存ワークフロー検証は揃っている。

## 目的

`listLlmModels` の coverage manifest を既存実装・検証実態に合わせ、API production coverage の planned marker を 37 件から 36 件へ減らす。

## 受け入れ条件

- [x] `listLlmModels` の local fixture handler が存在する。
- [x] `listLlmModels` の DSQL mapping key が存在し、`llm_models` を `users` の actor/role 条件で絞り込む query plan を持つ。
- [x] `packages/api-contract/src/implementation-coverage.ts` 上で `listLlmModels` に planned marker が残らない。
- [x] generated coverage mirror が更新される。
- [x] 既存検証により、管理者には judge model が見え、一般ユーザーには admin/system model が見えないことを確認する。
- [x] `npm run implementation-coverage:generate` が成功する。
- [x] `npm run implementation-coverage:check` が成功する。
- [x] `npm run api:implementation:check` が成功し、planned marker 数が 36 件になる。
- [x] `npm run api:implementation:check:production` の失敗リストから `listLlmModels` が消える。
- [x] `npm run admin:workflow:check` が成功する。
- [x] `npm run web:flow:check` が成功する。
- [x] `npm run typecheck:source` が成功する。
- [x] `npm run check:static` が成功する。
- [x] `git diff --check` が成功する。
- [ ] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- [ ] GitHub Actions の PR check が成功する。

## 実施結果

- `packages/api-contract/src/implementation-coverage.ts` の `listLlmModels` を production implemented とし、既存 aggregate unit/dsql smoke 検証を明示した。
- `packages/api-contract/src/implementation-coverage.js` を再生成した。
- `apps/api/src/local-api.ts` の local handler と `apps/api/src/repositories/dsql/apiRepository.ts` の DSQL mapping が既に存在することを確認した。
- `tools/check-admin-workflows.js` / `tools/check-web-flows.js` による model visibility 検証が通ることを確認した。

## 検証

- [x] `npm run implementation-coverage:generate`
- [x] `npm run implementation-coverage:check`
- [x] `npm run api:implementation:check` (`36 planned markers`)
- [x] `npm run api:implementation:check:production` は失敗するが、失敗リストから `listLlmModels` が消えた
- [x] `npm run admin:workflow:check`
- [x] `npm run web:flow:check`
- [x] `npm run typecheck:source`
- [x] `npm run check:static`
- [x] `git diff --check`
