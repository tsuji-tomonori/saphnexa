# Admin 評価実行モデル選択境界

状態: do

## 背景

`.workspace` の基本設計 v0.17 では API-23 `listLlmModels` により利用可能モデル一覧を返し、評価実行では評価データセット、モデル、プロンプト版、検索設定を記録する。現行 PR #3 では `listLlmModels` は local API / generated client にあるが、Admin 評価実行 UI はモデル一覧を参照せず、`startEvaluationRun` へデータセットIDのみを送っている。

## 受け入れ条件

- [x] Web Admin が `listLlmModels` route helper / generated operation helper で評価実行に使うモデル一覧を取得する。
- [x] Web Admin でモデルを選択し、`startEvaluationRun` request body に選択した `model_id` を含める。
- [x] 評価run詳細で選択した `model_id` を確認できる。
- [x] DSQL query plan と DB shared types が `llm_models` の一覧取得境界を持つ。
- [x] source/local/docs gates がモデル一覧と `model_id` 指定を確認する。
- [x] 変更範囲に見合う typecheck、source gate、UI/a11y/workflow、contract/test、docs check、diff check が成功する。

## 検証予定

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck -w @saphnexa/db-types`
- `npm run api-client:operation-types:check`
- `npm run typecheck:source`
- `npm run ui:check`
- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run api:openapi:check`
- `npm run docs:check`
- `npm run admin:workflow:check`
- `npm run test:integration:local`
- `npm run test:contract`
- `npm test`
- `npm run web:build:check`
- `git diff --check`

## 検証結果

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
