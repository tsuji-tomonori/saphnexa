# Aurora DSQL dev Flyway evidence

状態: doing

## 背景

- PR #4 は main に merge 済み。
- ユーザーは main を pull したうえで、Aurora DSQL dev cluster へ DB migration を実適用し、Flyway / schema / smoke / preflight evidence を残すことを依頼している。

## 目的

- Aurora DSQL dev cluster に `packages/db-migrations/flyway-dsql.conf` を使って V001/V002/V003 を適用する。
- 実clusterから取得した schema / COMMENT / CRUD smoke 結果を raw evidence と final preflight evidence に反映する。

## タスク種別

機能追加

## スコープ

- `packages/db-migrations/`
- Aurora DSQL dev cluster 実DB
- `docs/acceptance/evidence/raw/`
- `dist/acceptance/`
- `tools/` の必要な capture / smoke helper
- `docs/ops/runbooks/aws-dev-uat-validation.md` または関連運用docs

## 実施計画

1. `origin/main` 反映済みの専用 worktree で作業する。
2. 既存の AWS dev/UAT evidence builder、raw capture plan、DSQL/Flyway tooling を確認する。
3. Aurora DSQL dev endpoint / database / 認証方式を特定し、接続確認する。
4. `packages/db-migrations/flyway-dsql.conf` を使って V001/V002/V003 を適用する。
5. 実clusterから `schema_migrations`、主要tables、event tables、projection lineage columns を照合する。
6. `COMMENT ON TABLE/COLUMN` の実cluster可否を試し、成功/失敗とエラーを raw evidence に記録する。
7. chat / document / ingestion / evaluation / tool_invocation の最小CRUD smokeを実行し、結果を raw evidence に記録する。
8. `aws_dev_uat_preflight` evidence を実結果で materialize し、final gateを通す。
9. 必要検証、作業レポート、commit、PR、受け入れ条件コメント、self reviewを実施する。

## ドキュメント保守方針

- 実DSQL適用手順、COMMENT ON可否、smoke条件、preflight evidence materialize手順に差分が出た場合は運用docsへ反映する。
- 実行できなかった外部検証は、理由と残リスクを task / report / PR に明記する。

## 受け入れ条件

- AC-01: Aurora DSQL dev clusterへ接続できる。
- AC-02: `packages/db-migrations/flyway-dsql.conf` を使って V001/V002/V003 を適用できる。
- AC-03: `schema_migrations` に V003 まで成功履歴が残る。
- AC-04: 主要テーブルとevent tableが存在する。
- AC-05: `projection_event_id` / `projection_event_seq` / `projected_at` が対象tableに存在する。
- AC-06: `COMMENT ON TABLE/COLUMN` の可否を実clusterで確認する。
- AC-07: chat / document / ingestion / evaluation / tool_invocation の最小CRUD smokeが通る。
- AC-08: `aws_dev_uat_preflight` evidence に DSQL/Flyway実結果を反映する。

## 検証計画

- DSQL接続確認コマンド: 実行可能な repo tool / psql / Flyway / AWS CLI を調査して選定する。
- migration適用: `packages/db-migrations/flyway-dsql.conf` を含めた Flyway 実行。
- DB照合: `schema_migrations`、`information_schema.tables`、`information_schema.columns`、COMMENT可否、smoke CRUD query。
- evidence gate: `npm run aws:dev-uat:preflight:build` と `npm run aws:dev-uat:preflight:final`。
- repository gate: 変更範囲に応じて `git diff --check`、targeted npm checks、必要なら `npm run check:static`。

## PRレビュー観点

- 実DSQL evidence が fixture/sample ではなく aws-captured として扱われているか。
- migration履歴・schema検査・CRUD smoke の証跡が再確認可能か。
- COMMENT ON の可否が未確認のまま「適用済み」と誤記されていないか。
- AWS credential、endpoint以外のsecret、個人情報、tokenをcommitしていないか。

## リスク

- Dev cluster 接続情報、AWS credentials、ネットワーク権限、Flyway CLI / DSQL driver が不足すると実適用は blocked になる。
- 実DBへ migration を適用するため、dev clusterの状態変更を伴う。
- COMMENT ON が Aurora DSQL で unsupported の場合は、失敗結果を evidence として記録し、migration本体へは入れない。

## 進捗メモ

- 2026-05-30: ユーザーから Aurora DSQL dev cluster はまだ無いと確認した。
- 実cluster接続、Flyway適用、schema_migrations確認、COMMENT ON確認、CRUD smoke、final preflight evidence生成は未実施。
- cluster作成後に実行できるよう、`flyway-info` raw outputを DSQL/Flyway詳細証跡へ拡張し、preflight materializer / final checker で migration履歴、主要table、event table、projection lineage columns、COMMENT ON可否、CRUD smokeを検査するようにした。
- `node tools/capture-dsql-flyway-evidence.js` を追加し、CloudFormation `DsqlEndpoint`、AWS DSQL admin auth token、`packages/db-migrations/flyway-dsql.conf`、Flyway、psql を使って raw evidenceを採取する入口を用意した。
- PR #5 CI の `contract generation diff` で `aws:dev-uat:raw-input:fixture:check` が失敗したため、`aws_dev_uat_preflight.capture.sample.json` のような raw-input-first 経路でも `capture_provenance` の `raw/flyway-info.json` から DSQL/Flyway詳細を取り込むよう builder を修正した。

## 現時点の受け入れ条件状況

- AC-01: 未達。dev cluster未作成のため未接続。
- AC-02: 未達。dev cluster未作成のため V001/V002/V003 実適用は未実施。
- AC-03: 未達。実 `schema_migrations` は未確認。
- AC-04: 未達。実cluster上の主要table/event tableは未確認。
- AC-05: 未達。実cluster上の projection lineage columns は未確認。
- AC-06: 未達。実cluster上の `COMMENT ON TABLE/COLUMN` 可否は未確認。
- AC-07: 未達。実cluster上の CRUD smoke は未実施。
- AC-08: 未達。`aws_dev_uat_preflight` final evidence への実結果反映は未実施。

## 実施済みローカル検証

- `npm run aws:dev-uat:preflight`: 成功
- `npm run aws:dev-uat:raw-capture-plan:check`: 成功
- `npm run aws:dev-uat:preflight-raw-input:fixture:check`: 成功
- `npm run aws:dev-uat:raw-input-scaffold:check`: 成功
- `npm run docs:check`: 成功
- `node tools/capture-dsql-flyway-evidence.js --help`: 成功
- `git diff --check`: 成功
- `npm run check:static`: 初回は新規worktreeで `tsc: not found` により失敗。`npm ci` 後に再実行して成功。
- `npm run aws:dev-uat:raw-input:fixture:check`: CI失敗後に修正して成功。
