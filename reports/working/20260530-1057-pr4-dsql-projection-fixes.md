# PR #4 DSQL / projection 修正 作業完了レポート

## 受けた指示

- PR #4 のレビュー指摘について「推奨値でなおして」。
- DSQL は推奨案Bの `executeInTransaction=false` 明示 + gate追加を採用する。
- projection は曖昧な `derivedFrom` をなくし、具体 event table へ到達できる状態にする。

## 要件整理

- 複数DDLを含む migration について、Aurora DSQL の `1 DDL / transaction` 制約に対する実行方針を repository 内で明示する。
- `db:dsql-compat:check` で DDL 種別ごとの件数、`COMMENT ON` 禁止、`CREATE INDEX ASYNC`、非transactional実行方針を検査する。
- `sourceOfTruthKind = projection` のカラムは具体的な event table 名を `derivedFrom` に持つ。
- projection table は `eventSourceMappings` に含め、V003で `projection_event_id` / `projection_event_seq` / `projected_at` を持つ。
- 生成DB docsと運用docsにも、DSQL実行方針と event append / projector 責務を反映する。

## 検討・判断

- migrationを1 DDL 1 fileへ分割する案ではなく、レビュー推奨の `flyway.executeInTransaction=false` 方針を採用した。
- `packages/db-migrations/flyway-dsql.conf` を DSQL 用 profile とし、V002/V003にも markerを残した。
- projection不足分は別分類へ逃がさず、今回の案Bに合わせて不足 event table と lineage columns を追加した。
- Event table の append-only、`event_id` / `idempotency_key` / `event_seq`、OCC retryは実装コードではなく設計docs上のサービス責務として明記した。

## 実施作業

- `packages/db-migrations/flyway-dsql.conf` を追加し、`flyway.executeInTransaction=false` を明示。
- `V002__event_source_projection_tables.sql` に不足 event tableを追加。
- `V003__projection_metadata_columns.sql` に不足 projection table の lineage columnsを追加。
- `tools/build-db-metadata-source.js`、`tools/db-metadata-lib.js` を更新し、全projection列の `derivedFrom` を具体 event tableへ揃えた。
- `tools/check-db-dsql-compat.js` を更新し、DDL件数、DSQL非transactional設定、runbook記載を検査。
- `tools/check-db-event-source.js` を更新し、曖昧な `derivedFrom`、mapping不足、lineage columns不足を禁止。
- `tools/generate-db-docs.js` と生成docsを更新し、event append / projector責務を明記。
- `docs/ops/local-verification.md` に DSQL transaction strategy と実適用未完了の扱いを追記。

## 成果物

- DSQL migration profile: `packages/db-migrations/flyway-dsql.conf`
- 追加・更新された migration: `packages/db-migrations/migrations/V002__event_source_projection_tables.sql`, `packages/db-migrations/migrations/V003__projection_metadata_columns.sql`
- 追加 gate: `tools/check-db-dsql-compat.js`, `tools/check-db-event-source.js`
- 更新 docs: `docs/generated/db/*`, `docs/ops/local-verification.md`

## 検証

- `npm run db:metadata:build`: 成功
- `node tools/build-db-types-source.js`: 成功
- `npm run db:metadata:check`: 成功
- `npm run db:docs:check`: 成功
- `npm run db:dsql-compat:check`: 成功
- `npm run db:event-source:check`: 成功
- `npm run check:static`: 成功
- `npm run ci:check`: 成功
- `git diff --check`: 成功
- `npm run verify`: 成功

## Fit評価

- Blocker 1: `flyway.executeInTransaction=false` 方針、DDL件数検査、runbook記載を追加し、推奨案Bに合わせた。
- Blocker 2: `derivedFrom = 対応するdomain event` 相当を禁止し、projection列から具体 event table への到達性と V003 lineage columnsを gate化した。
- Should Fix 4: Event append / projector の append-only、冪等性、OCC retry責務を docs に明記した。

## 未対応・制約・リスク

- Aurora DSQL 実clusterへの Flyway適用は未実施。今回の対応は repository-local static gate と runbook記載であり、実適用証跡ではない。
- `COMMENT ON` は generated SQL/docsとして維持し、Aurora DSQL migration本体にはまだ入れていない。
- Knip / dependency-cruiser / Gitleaks 本体導入は今回の範囲外で、repository-local equivalent gate のまま。
