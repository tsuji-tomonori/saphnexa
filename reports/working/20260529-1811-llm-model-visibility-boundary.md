# LLM モデル一覧の可視性境界修正 作業レポート

## 受けた指示

- `main` を pull/fetch してから作業する。
- `.workspace` の基本設計と `plan-20260529.txt` に基づき、TypeScript framework / API / Web UI の未接続境界を前進させる。
- リポジトリルールに従い、task md、検証、PR 更新、作業レポートを残す。

## 要件整理

- API-23 `listLlmModels` の local API 返却範囲を、モデル catalog の `visible_to_user` / `allowed_role` と整合させる。
- general_user には visible な chat model のみを返す。
- admin には visible model と admin judge model を返す。
- system-only embedding model は general_user/admin のどちらにも返さない。
- DSQL と local gate の認可意図を docs / report に残す。

## 検討・判断

- DSQL plan にはすでに role/visible 境界があるため、今回の焦点は local API/store の不一致解消とした。
- `listLlmModels(actor)` に変更し、store 境界で active user を要求する形にした。
- `system` model はユーザー向け API の返却対象にせず、admin にも返さない判断とした。
- `startEvaluationRun` の model 存在検証は別境界として残し、今回は一覧 API の可視性漏れ防止に絞った。

## 実施作業

- `apps/api/src/local-api.js` で `store.listLlmModels(actor)` を呼ぶよう変更。
- `packages/domain/src/store.js` に actor-aware な `listLlmModels` を追加。
- `packages/domain/src/store-types.ts` に `LlmModelRecord` と `listLlmModels(actor)` 型を追加。
- `tools/check-web-flows.js` と `tools/check-admin-workflows.js` に general/admin/system model の可視性境界検査を追加。
- `tools/check-api-performance.js` に general_user への admin judge model 漏えい検査を追加。
- `docs/ops/local-verification.md` に local gate の可視性確認内容を追記。

## 成果物

- `apps/api/src/local-api.js`
- `packages/domain/src/store.js`
- `packages/domain/src/store-types.ts`
- `tools/check-web-flows.js`
- `tools/check-admin-workflows.js`
- `tools/check-api-performance.js`
- `docs/ops/local-verification.md`
- `tasks/do/20260529-1811-llm-model-visibility-boundary.md`

## 検証

- `npm run typecheck -w @saphnexa/api`: pass
- `npm run typecheck:source`: pass
- `npm run web:flow:check`: pass
- `npm run admin:workflow:check`: pass
- `npm run perf:api:local`: pass
- `npm run test:contract`: pass
- `npm test`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass

## fit 評価

- 総合fit: 4.7 / 5.0
- 理由: API-23 の local 可視性境界は DSQL intent と揃い、一般ユーザーへの admin/system model 漏えいを local gates で確認できた。実 DSQL SQL 実行と本番 authorizer 連携はこの PR の既存制約と同じく未検証。

## 未対応・制約・リスク

- 実 Aurora DSQL での `listLlmModels` SQL 実行は未検証。
- 実 Bedrock model catalog seed / catalog sync は未検証。
- `startEvaluationRun` の指定 `model_id` 存在検証は今回の範囲外。次の評価実行入力検証境界として扱う余地がある。
