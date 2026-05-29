# LLM モデル一覧の可視性境界修正

状態: done
タスク種別: 修正

## 背景

API-23 `listLlmModels` は general_user / admin の両ロールに公開されるモデル一覧 API であり、`llm_models.visible_to_user` と `allowed_role` に基づいて利用者ごとの返却範囲を制限する必要がある。直前の作業で DSQL query plan には可視性・ロール境界を追加したが、local API は `store.listLlmModels()` を actor なしで呼び、active model を全件返している。

## なぜなぜ分析

- 問題: local API の `listLlmModels` が general_user に admin/system 用の非表示モデルを返す可能性がある。
- 確認済み事実:
  - `packages/model-catalog/src/models.js` では `logical-evaluation-judge` が `visible_to_user: false`, `allowed_role: "admin"`。
  - `logical-embedding-default` は `visible_to_user: false`, `allowed_role: "system"`。
  - `packages/domain/src/store.js` の `listLlmModels` は `status === active` のみで filter している。
  - `apps/api/src/local-api.js` は `store.listLlmModels()` を actor なしで呼ぶ。
  - DSQL `listLlmModels` は active user、visible/admin、role 条件を持つ。
- 推定原因:
  - API-23 の route 契約追加時点では local fixture のモデルカタログを単純に返す実装で、`visible_to_user` / `allowed_role` の意味を store 境界へ落としていなかった。
- 根本原因:
  - local store の `listLlmModels` interface が caller actor を受け取らず、モデル catalog の認可属性を評価できない形だった。
- 対応方針:
  - `listLlmModels(actor)` に変更し、active user と `visible_to_user` / `allowed_role` を評価する。
  - admin は評価用 admin model を取得できるが、system-only model は返さない。
  - general_user は visible かつ general_user 向け model のみ取得する。
  - local/source gate と API performance smoke で境界を確認する。

## 目的

local API / source gate における `listLlmModels` の返却範囲を DSQL の認可意図と揃え、Admin 評価実行 UI が admin 用 judge model を使える一方、一般ユーザーへ非表示 model を漏らさない。

## スコープ

- `apps/api/src/local-api.js`
- `packages/domain/src/store.js`
- `packages/domain/src/store-types.ts`
- `tools/check-web-flows.js`
- 必要に応じた関連 local/source gate
- `docs/ops/local-verification.md`

## 受け入れ条件

- [x] local API `listLlmModels` が actor を store へ渡す。
- [x] local store `listLlmModels(actor)` が active user を要求する。
- [x] general_user の `listLlmModels` には `logical-chat-default` が含まれる。
- [x] general_user の `listLlmModels` には `logical-evaluation-judge` と `logical-embedding-default` が含まれない。
- [x] admin の `listLlmModels` には `logical-chat-default` と `logical-evaluation-judge` が含まれる。
- [x] admin の `listLlmModels` には `logical-embedding-default` が含まれない。
- [x] DSQL と local gate のモデル可視性意図を docs / report に記録する。
- [x] 変更範囲に見合う typecheck、source/local/API/docs/diff check が成功する。

## 検証予定

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck:source`
- `npm run web:flow:check`
- `npm run admin:workflow:check`
- `npm run perf:api:local`
- `npm run test:contract`
- `npm test`
- `npm run docs:check`
- `git diff --check`

## 検証結果

- `npm run typecheck -w @saphnexa/api`: pass
- `npm run typecheck:source`: pass
- `npm run web:flow:check`: pass
- `npm run admin:workflow:check`: pass
- `npm run perf:api:local`: pass
- `npm run test:contract`: pass
- `npm test`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass

## PR レビュー観点

- API-23 が public unauthenticated になっていないこと。
- general_user へ admin/system 用 model を返していないこと。
- Admin 評価実行 UI が評価用 model を取得できること。
- 実装に dataset 固有分岐や benchmark 期待語句を追加していないこと。

## リスク

- 実 DSQL SQL 実行は今回も未検証。local/source gate と query plan の整合確認に留まる。
