# PR #4 DSQL / projection 修正

状態: done

## 背景

- PR #4 のレビューで、Aurora DSQL の 1 transaction 1 DDL 制約に対する migration 実行戦略と、projection列の `derivedFrom` 完全性が不足していると指摘された。
- ユーザーは「推奨値でなおして」と依頼しているため、DSQLは推奨案Bの `executeInTransaction=false` 明示 + gate追加、projectionは曖昧な `derivedFrom` を禁止する方針で修正する。

## 目的

- Flyway / DSQL 実行時の非transactional DDL方針を repository 内で明示し、static gateで検査する。
- `sourceOfTruthKind = projection` のカラムが具体的な event table に到達できるようにし、曖昧な「対応するdomain event」を禁止する。

## タスク種別

修正

## なぜなぜ分析要約

- 確認した事実: V002 は複数の `CREATE TABLE`、V003 は複数の `ALTER TABLE` を1 migration fileに含む。既存 `check-db-dsql-compat.js` は `COMMENT ON` と通常 `CREATE INDEX` の禁止だけを見ていた。
- 確認した事実: metadata生成では一部の状態系カラムに具体的な `derivedFrom` がなく、docs上で「対応するdomain event」相当の曖昧な説明になっていた。
- 根本原因: plan対応時の gate が文言・件数中心で、DSQL transaction strategyとprojection lineage完全性を不変条件として扱っていなかった。
- 対応方針: DSQL非transactional実行方針を設定ファイル・runbook・gateに追加し、projection列は具体event tableの `derivedFrom` または非projection分類へ分ける。

## スコープ

- `packages/db-schema`
- `packages/db-migrations`
- `tools`
- `docs/generated/db`
- `docs/ops/local-verification.md`
- PR #4 コメント

## 実施計画

1. Flyway / DSQL設定を追加し、複数DDL migrationには `executeInTransaction=false` 相当を必須化する。
2. `check-db-dsql-compat.js` でDDL種別ごとの件数とtransaction markerを検査する。
3. projection列の `derivedFrom` を具体event tableに揃え、必要な event table / projection lineage columns を追加する。
4. `check-db-event-source.js` で `derivedFrom` の具体性、eventSourceMappings、V003 lineage columnsを検査する。
5. DB docsを再生成し、必要検証を実行する。

## 受け入れ条件

- AC-01: DDL数が2以上のmigrationは非transactional実行方針が明示されている。
- AC-02: `db:dsql-compat:check` が `CREATE TABLE`、`ALTER TABLE`、`DROP TABLE`、`CREATE INDEX`、`CREATE VIEW`、`COMMENT ON` の件数と制約を検査する。
- AC-03: Flyway DSQL実行時に `executeInTransaction=false` 相当の設定がある。
- AC-04: `sourceOfTruthKind = projection` のカラムは具体event table名を `derivedFrom` に持つ。
- AC-05: `derivedFrom = 対応するdomain event` 相当の曖昧値は禁止されている。
- AC-06: projection columnを持つtableは `eventSourceMappings` に存在し、V003で `projection_event_id` / `projection_event_seq` / `projected_at` を持つ。
- AC-07: `npm run db:dsql-compat:check`、`npm run db:event-source:check`、`npm run check:static` が成功する。

## 検証計画

- `npm run db:dsql-compat:check`
- `npm run db:event-source:check`
- `npm run db:metadata:check`
- `npm run db:docs:check`
- `npm run check:static`
- `npm run ci:check`
- `git diff --check`

## リスク

- Aurora DSQL実機適用そのものはこの修正でも未実施。実適用PRで `executeInTransaction=false` の実行証跡が必要。

## 完了結果

- AC-01: 達成。`packages/db-migrations/flyway-dsql.conf` と V002/V003 markerで非transactional実行方針を明示。
- AC-02: 達成。`check-db-dsql-compat.js` がDDL種別ごとの件数、`COMMENT ON`、`CREATE INDEX ASYNC`、runbook記載を検査。
- AC-03: 達成。`flyway.executeInTransaction=false` を DSQL profile に追加。
- AC-04: 達成。projection列の `derivedFrom` を具体 event tableへ接続。
- AC-05: 達成。曖昧な `derivedFrom` を `check-db-event-source.js` で禁止。
- AC-06: 達成。projection table mapping と V003 lineage columnsを `check-db-event-source.js` で検査。
- AC-07: 達成。`npm run db:dsql-compat:check`、`npm run db:event-source:check`、`npm run check:static` は成功。

## 実施済み検証

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

## PRコメント

- 修正結果: https://github.com/tsuji-tomonori/saphnexa/pull/4#issuecomment-4581276416
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/4#issuecomment-4581277222
