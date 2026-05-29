# 評価実行 model_id 検証境界 作業レポート

## 受けた指示

- `main` を pull/fetch してから作業する。
- `.workspace` の基本設計と `plan-20260529.txt` に基づき、TypeScript framework / API / Web UI の未接続境界を前進させる。
- リポジトリルールに従い、task md、検証、PR 更新、作業レポートを残す。

## 要件整理

- Admin 評価実行で任意文字列の `model_id` を記録できないようにする。
- local store はモデルカタログに存在し、Admin が利用できる `chat` / `judge` model のみを許可する。
- DSQL plan も `llm_models` を参照し、active な `chat` / `judge` model のみ insert 対象にする。
- unknown model と system-only embedding model を拒否する local gate を追加する。

## 検討・判断

- `listLlmModels(actor)` で確立した可視性境界を `startEvaluationRun` でも再利用し、UI 選択だけに依存しない API 側検証にした。
- 未指定 `model_id` は既存互換のため `logical-chat-default` に解決する。
- system-only / embedding model は評価実行対象外として拒否する。
- DSQL では `target_model` CTE を追加し、対象 model がない場合は insert されない query plan にした。

## 実施作業

- `packages/domain/src/store.js` に `resolveEvaluationModel` を追加し、`startEvaluationRun` の `model_id` を検証・解決。
- `apps/api/src/repositories/dsql/apiRepository.ts` の `startEvaluationRun` plan に `target_model` CTE と `llm_models` join を追加。
- `tools/check-web-flows.js` / `tools/check-admin-workflows.js` / `tools/check-db-integrity.js` に unknown model と embedding model の拒否、既定 model 解決の検査を追加。
- `tools/check-type-surface.js` に DSQL plan token を追加。
- `docs/ops/local-verification.md` に評価実行 model 検証境界を追記。

## 成果物

- `packages/domain/src/store.js`
- `apps/api/src/repositories/dsql/apiRepository.ts`
- `tools/check-web-flows.js`
- `tools/check-admin-workflows.js`
- `tools/check-db-integrity.js`
- `tools/check-type-surface.js`
- `docs/ops/local-verification.md`
- `tasks/do/20260529-1817-evaluation-model-validation-boundary.md`

## 検証

- `npm run typecheck -w @saphnexa/api`: pass
- `npm run typecheck:source`: pass
- `npm run web:flow:check`: pass
- `npm run admin:workflow:check`: pass（初回は評価run件数期待値が旧値で失敗し、検証追加後の正常系数へ修正して再実行 pass）
- `npm run db:integrity:check`: pass
- `npm run test:integration:local`: pass
- `npm run test:contract`: pass
- `npm test`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass

## fit 評価

- 総合fit: 4.7 / 5.0
- 理由: 評価実行の `model_id` 入力検証を local store / DSQL plan / local gates / docs に通し、基本設計のモデルカタログ境界に近づけた。実 Aurora DSQL SQL 実行と実 Bedrock Evaluations job は未検証のため満点ではない。

## 未対応・制約・リスク

- 実 Aurora DSQL での `target_model` CTE 実行は未検証。
- 実 Bedrock model catalog seed / catalog sync は未検証。
- 評価 runner / Bedrock Evaluations job 側での model 使用検証は未実装。
