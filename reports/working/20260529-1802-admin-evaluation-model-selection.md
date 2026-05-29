# Admin 評価実行モデル選択境界 作業レポート

## 受けた指示

- `main` を pull/fetch してから作業する。
- `.workspace` の基本設計と `plan-20260529.txt` に沿って TypeScript framework / API / Web UI の未接続境界を前進させる。
- リポジトリローカルルールに従い task md、検証、PR 更新、作業レポートを残す。

## 要件整理

- API-23 `listLlmModels` の利用可能モデル一覧を Admin 評価実行 UI から参照する。
- 評価実行の `startEvaluationRun` request body に、選択した `model_id` を含める。
- 評価run詳細で、実行時に指定した `model_id` を確認できる。
- DSQL / DB shared types / source gates / docs を同期する。

## 検討・判断

- UI は既存の `DataTable` / `FormField` / TanStack Query hook のパターンに合わせた。
- `listLlmModels` は一般ユーザーには visible model、管理者には評価用 judge model を含める DSQL 境界にした。
- 本番経路の架空値 fallback は追加せず、モデル一覧が空なら空状態として表示する。

## 実施作業

- `useLlmModels` hook を追加し、`apiGetOperation("listLlmModels", apiRoutes.listLlmModels())` でモデル一覧を取得。
- Admin 評価実行 UI にモデル一覧、モデルID入力、モデル選択ボタンを追加。
- `useStartEvaluationRun` を `{ datasetId, modelId }` 入力に変更し、`model_id` を API request body に含める。
- DSQL repository に `listLlmModels` query plan を追加。
- `llm_models` を DB table metadata と shared DB row types に追加。
- source/local/UI/a11y/admin workflow/docs gates を、モデル一覧と選択 `model_id` を検査する内容へ更新。
- `docs/ops/local-verification.md` に Admin 評価実行のモデル一覧境界を反映。

## 成果物

- `apps/web/src/features/admin/AdminActions.tsx`
- `apps/web/src/hooks/useStartEvaluationRun.ts`
- `apps/web/src/types.ts`
- `apps/api/src/repositories/dsql/apiRepository.ts`
- `packages/db-schema/src/table-metadata.ts`
- `packages/db-types/src/index.ts`
- `tools/check-*.js`
- `docs/ops/local-verification.md`
- `tasks/do/20260529-1802-admin-evaluation-model-selection.md`

## 検証

- `npm run typecheck -w @saphnexa/api`: pass
- `npm run typecheck -w @saphnexa/web`: pass
- `npm run typecheck -w @saphnexa/db-types`: pass
- `npm run api-client:operation-types:check`: pass
- `npm run typecheck:source`: pass
- `npm run ui:check`: pass
- `npm run web:flow:check`: pass
- `npm run web:a11y:check`: pass
- `npm run api:openapi:check`: pass
- `npm run docs:check`: pass
- `npm run admin:workflow:check`: pass
- `npm run db:integrity:check`: pass
- `npm run test:integration:local`: pass
- `npm run test:contract`: pass
- `npm test`: pass
- `npm run web:build:check`: pass（Vite の 500 kB chunk warning は継続）
- `git diff --check`: pass

## fit 評価

- 基本設計の `llm_models` / 評価実行 `model_id` 記録境界に対し、Web UI、API client helper、DSQL plan、local workflow の接続を追加できた。
- 実 Bedrock model catalog 同期、実 Aurora DSQL SQL 実行、実 Bedrock Evaluations job、実ブラウザ E2E は今回の範囲外で、既存 docs の未接続事項として維持した。

## 未対応・制約・リスク

- `listLlmModels` の local API は model catalog fixture に基づく。実 AWS / DSQL 上の seed 適用は未検証。
- `startEvaluationRun` の DSQL plan は指定 `model_id` の存在検証までは追加していない。今回はモデル一覧選択と request 記録の UI/API 境界を対象にした。
- Vite production build は成功したが、既存の 500 kB chunk warning は残っている。
