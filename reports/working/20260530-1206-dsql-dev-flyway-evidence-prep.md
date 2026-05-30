# DSQL dev Flyway evidence 準備レポート

## 受けた指示

- PR #4 merge 後に main を pull してから、Aurora DSQL dev clusterへ V001/V002/V003 を適用し、Flyway / schema / COMMENT ON / CRUD smoke / preflight evidence を取得する。
- 追加確認として、ユーザーから Aurora DSQL dev cluster はまだ無いと共有された。

## 要件整理

- 実clusterが存在しないため、DSQL接続、Flyway実適用、`schema_migrations`、table/column確認、COMMENT ON可否確認、CRUD smoke、final preflight evidence生成は未達。
- 今回は cluster 作成後に実証跡を取得して final evidence へ反映できるよう、capture helper と gate を先に整える。

## 検討・判断

- fixtureやsampleを最終 evidence として代替しない方針を維持した。
- 既存 preflight は `flyway-info` の `latestVersion` と checksum 中心だったため、今回の要件に合わせて raw output と final checkerを拡張した。
- 実cluster未作成の状態では task を done にせず、受け入れ条件は未達として記録した。

## 実施作業

- main を `git pull` で最新化し、`origin/main` から専用 worktree `dsql-dev-flyway-evidence` を作成。
- task md `tasks/do/20260530-1157-dsql-dev-flyway-evidence.md` を作成し、受け入れ条件を明記。
- `tools/dsql-flyway-evidence-requirements.js` を追加し、必須 migration / core table / event table / projection lineage columns / CRUD smoke flow を定義。
- `tools/capture-dsql-flyway-evidence.js` を追加し、Flyway migrate/info、`schema_migrations`、information_schema、COMMENT ON probe、smoke結果を raw JSON にまとめる入口を作成。
- `tools/aws-dev-uat-preflight-raw-input-materializer.js` と `tools/check-aws-dev-uat-preflight.js` を更新し、aws-captured final evidenceでは DSQL/Flyway詳細証跡を必須化。
- `tools/aws-dev-uat-evidence-builders.js` を更新し、DSQL詳細証跡を final preflight evidence に保持。
- `aws_dev_uat_preflight.capture.sample.json` のような raw-input-first 経路でも、`capture_provenance` の `raw/flyway-info.json` から DSQL詳細証跡を取り込むようにした。
- `tools/aws-dev-uat-raw-capture-plan.js` を更新し、`flyway-info` captureを新 helper に差し替え。
- `docs/acceptance/evidence/raw/flyway-info.json` fixture と `docs/ops/runbooks/aws-dev-uat-validation.md` を更新。

## 成果物

- `tools/capture-dsql-flyway-evidence.js`
- `tools/dsql-flyway-evidence-requirements.js`
- `tools/aws-dev-uat-preflight-raw-input-materializer.js`
- `tools/check-aws-dev-uat-preflight.js`
- `tools/aws-dev-uat-raw-capture-plan.js`
- `docs/ops/runbooks/aws-dev-uat-validation.md`
- `tasks/do/20260530-1157-dsql-dev-flyway-evidence.md`

## 検証

- `npm run aws:dev-uat:preflight`: 成功
- `npm run aws:dev-uat:raw-capture-plan:check`: 成功
- `npm run aws:dev-uat:preflight-raw-input:fixture:check`: 成功
- `npm run aws:dev-uat:raw-input-scaffold:check`: 成功
- `npm run aws:dev-uat:raw-input:fixture:check`: CI失敗後に修正して成功
- `npm run docs:check`: 成功
- `node tools/capture-dsql-flyway-evidence.js --help`: 成功
- `git diff --check`: 成功
- `npm run check:static`: 初回は新規worktreeに依存関係が無く `tsc: not found` で失敗。`npm ci` 後の再実行は成功。

## Fit評価

- 総合fit: 2.5 / 5.0。
- 理由: dev cluster 未作成により、ユーザー指定の実適用・実証跡要件はまだ満たせない。一方で、cluster 作成後に必要な実証跡を fixtureで代替せずに取得・検査する repository 側の準備は進めた。

## 未対応・制約・リスク

- Aurora DSQL dev clusterへの接続: 未実施。cluster未作成のため。
- Flyway V001/V002/V003 実適用: 未実施。cluster未作成のため。
- `schema_migrations`、主要table、event table、projection lineage columnsの実確認: 未実施。
- `COMMENT ON TABLE/COLUMN` 実可否確認: 未実施。
- chat / document / ingestion / evaluation / tool_invocation CRUD smoke: 未実施。
- `aws_dev_uat_preflight` final evidence への実結果反映: 未実施。
