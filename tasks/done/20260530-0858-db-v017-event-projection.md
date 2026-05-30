# DB v0.17 event source / projection 整合

状態: done

## 背景

- `.workspace/plan-20260530.txt` は、基本設計 v0.17 の案Bとして「event を正本、既存 `status` 等を projection / read model」として扱う DB 整合を求めている。
- `V001__initial_saphnexa_schema.sql` は main に存在するため、既存 migration を直接書き換えず、追加 migration と metadata / docs / static gate で意味を固定する。

## 目的

- V001 の全テーブル・全カラムに日本語説明、分類、保持方針、更新主体を付ける。
- `status`、`is_deleted`、`deleted_at`、`updated_at` などの状態系カラムを projection として明示する。
- domain event table と projection metadata columns を追加 migration 化する。
- metadata から SQL comment と DB docs を生成・検査できるようにする。
- 静的解析・CI に DB v0.17 整合チェックを組み込む。

## タスク種別

機能追加

## スコープ

- `packages/db-schema`
- `packages/db-migrations`
- `tools`
- `docs/generated/db`
- `docs/ops/local-verification.md`
- `docs/acceptance/traceability.md`
- `package.json`
- `Taskfile.yml`
- `.github/workflows/ci.yml`

## 実施計画

1. V001 からテーブル・カラム・主キーを確認し、metadata coverage を 100% にする。
2. metadata に日本語名、説明、domain、sourceOfTruthKind、PII分類、保持方針、更新主体を追加する。
3. SQL comment / DB docs / event-source projection docs の生成・検査ツールを追加する。
4. event source table と projection metadata columns の追加 migration を作る。
5. static check script と CI job を追加する。
6. 変更範囲に応じた検証を実行し、失敗時は修正して再実行する。

## ドキュメント保守計画

- `docs/generated/db/*.md` は generator から生成する。
- `docs/ops/local-verification.md` に DB v0.17 / static check のローカル検証を追記する。
- `docs/acceptance/traceability.md` に acceptance trace を追記する。

## 受け入れ条件

- AC-01: V001 の全テーブル・全カラムが metadata に登録されている。
- AC-02: 全テーブル・全カラムに日本語説明がある。
- AC-03: `schema-comments.sql` が生成される。
- AC-04: `COMMENT ON TABLE/COLUMN` の生成件数がテーブル数・カラム数と一致する。
- AC-05: DSQL における `COMMENT ON` 可否が検証または明確に TODO 化されている。
- AC-06: 案Bとして、イベント正本と projection の対応表がある。
- AC-07: `status` 系カラムは正本ではなく projection としてコメントされている。
- AC-08: domain event table の migration がある。
- AC-09: projection 更新境界が API / Worker / Projector 別に明記されている。
- AC-10: DB docs が生成され、Docusaurus 公開対象に含まれる。
- AC-11: `tsc -b --noEmit` 相当の typecheck が通る。
- AC-12: Knip / dependency-cruiser / Gitleaks 相当の検査が CI に入る。
- AC-13: class 禁止または functional lint 方針が入る。
- AC-14: RAG、BM25F、Agent、UI の既存 source gate を壊さない。
- AC-15: `npm run verify` と `npm run check:static` が成功する。

## 検証計画

- `npm run db:metadata:check`
- `npm run db:comments:check`
- `npm run db:event-source:check`
- `npm run db:docs:check`
- `npm run db:dsql-compat:check`
- `npm run check:static`
- `npm run verify`
- `git diff --check`

## PRレビュー観点

- V001 を直接編集していないこと。
- metadata と生成 docs / SQL が同一 source から再現できること。
- 状態系カラムが正本扱いに戻っていないこと。
- static gate が既存 CI の検査意図を弱めていないこと。
- 未実施検証を実施済みとして PR 本文やコメントに書いていないこと。

## リスク

- Aurora DSQL の `COMMENT ON` 実機検証は、この環境で DSQL 接続先がない場合は TODO / runbook 記録に留まる。
- Knip / dependency-cruiser / Gitleaks 等の実ツール導入は依存追加を伴う可能性があるため、既存の repository-local static gate として代替実装する場合がある。

## 完了確認

- PR: https://github.com/tsuji-tomonori/saphnexa/pull/4
- 受け入れ条件コメント: https://github.com/tsuji-tomonori/saphnexa/pull/4#issuecomment-4580939408
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/4#issuecomment-4580939383
- 検証: `npm run verify` pass、`npm run check:static` pass、`git diff --check` pass。
