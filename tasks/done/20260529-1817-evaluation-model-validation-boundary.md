# 評価実行 model_id 検証境界

状態: do
タスク種別: 修正

## 背景

基本設計 v0.17 では、評価実行は評価データセット、モデル、プロンプト版、検索設定を記録する。直近の作業で Admin UI は `listLlmModels` からモデルを選択し、local API はモデル一覧の可視性境界を持つようになった。一方で `startEvaluationRun` は、local store / DSQL plan ともに指定された `model_id` を存在検証せず、そのまま `evaluation_runs.model_id` に記録できる。

## なぜなぜ分析

- 問題: Admin 評価実行が任意文字列の `model_id` を記録できる。
- 確認済み事実:
  - `packages/domain/src/store.js` の `startEvaluationRun` は `input.model_id || "logical-chat-default"` をそのまま使う。
  - DSQL `startEvaluationRun` は `COALESCE(NULLIF(:model_id, ''), 'logical-chat-default')` をそのまま insert する。
  - `listLlmModels` は local / DSQL ともにロール・可視性境界を持つ。
  - Admin workflow は `logical-evaluation-judge` の正常系を確認しているが、不正 `model_id` の拒否は確認していない。
- 推定原因:
  - 評価実行 UI のモデル選択追加時点では、選択済み model を送る境界を優先し、API 側の存在検証は未接続事項として残した。
- 根本原因:
  - `startEvaluationRun` がモデルカタログ境界を参照せず、評価実行に利用可能な model を確定する責務を持っていなかった。
- 対応方針:
  - local store で admin が取得可能な `listLlmModels(actor)` のうち、評価実行に使える `chat` / `judge` model だけを許可する。
  - DSQL plan でも `llm_models` へ join し、active admin user が利用できる `chat` / `judge` model だけを insert 対象にする。
  - 不正 model は local API で 403 とし、source/local gates で回帰を防ぐ。

## 目的

Admin 評価実行がモデルカタログに存在しない、または system-only / embedding など評価実行対象外の model を記録できないようにする。

## スコープ

- `packages/domain/src/store.js`
- `apps/api/src/repositories/dsql/apiRepository.ts`
- `tools/check-web-flows.js`
- `tools/check-admin-workflows.js`
- `tools/check-db-integrity.js`
- `docs/ops/local-verification.md`

## 受け入れ条件

- [x] local `startEvaluationRun` が `logical-evaluation-judge` を受け付ける。
- [x] local `startEvaluationRun` が未指定 `model_id` を既定 model に解決する。
- [x] local `startEvaluationRun` が未知の `model_id` を拒否する。
- [x] local `startEvaluationRun` が system-only embedding model を拒否する。
- [x] DSQL `startEvaluationRun` が `llm_models` を参照して `chat` / `judge` の active model だけを insert 対象にする。
- [x] source/local/docs gates が評価実行 model 検証境界を確認する。
- [x] 変更範囲に見合う typecheck、source/local/API/docs/diff check が成功する。

## 検証予定

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck:source`
- `npm run web:flow:check`
- `npm run admin:workflow:check`
- `npm run db:integrity:check`
- `npm run test:integration:local`
- `npm run test:contract`
- `npm test`
- `npm run docs:check`
- `git diff --check`

## 検証結果

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

## PR レビュー観点

- general_user の評価実行拒否境界を弱めていないこと。
- system-only / embedding model を評価実行に使わせていないこと。
- DSQL plan と local store の model 選択条件が大きく乖離していないこと。
- dataset 固有分岐や benchmark 期待語句を追加していないこと。

## リスク

- 実 Aurora DSQL での SQL 実行は未検証。source gate と local gate による計画検査に留まる。
