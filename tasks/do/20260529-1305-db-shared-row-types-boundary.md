# DB shared row types boundary

## 背景

`plan-20260529.txt` では、DB type が frontend/backend 共有型として未完成であること、API/Agent/Frontend を TypeScript framework 実装へ昇格する必要があることが示されている。
現状は `packages/db-schema` に required table 名と主要 table metadata があるが、runtime repository や query plan が参照できる row/insert/update 型の共有パッケージはない。

## 目的

`packages/db-types` を追加し、`packages/db-schema` の metadata と同期した DB row/insert/update 型境界を提供する。API の DSQL query plan がその型を参照できる状態にし、DB schema と repository の型境界を強める。

## タスク種別

機能追加

## スコープ

- `packages/db-types` package、tsconfig、typecheck script を追加する。
- DB metadata 対応の `DbRowByTable` / `DbInsertByTable` / `DbUpdateByTable` / helper 型を追加する。
- API DSQL repository の query executor result 型で DB row 型を参照する。
- source gate と `docs/ops/local-verification.md` を更新する。
- 実 DSQL introspection / generated client / Flyway apply は今回の対象外とし、未検証として明記する。

## 実装計画

1. `packages/db-types` を作成し、主要 metadata table の row 型を定義する。
2. nullable column から insert/update 型を導出できる helper 型を定義する。
3. API DSQL repository の row typing を `@saphnexa/db-types` へ接続する。
4. `tools/check-type-surface.js` と docs を更新する。
5. targeted / full typecheck と docs/contract/diff check を実行する。

## ドキュメントメンテナンス計画

DB shared type の local verification 範囲が増えるため、`docs/ops/local-verification.md` に `packages/db-types` の source-level 検証と、実 DSQL introspection が未実施であることを追記する。

## 受け入れ条件

- [ ] `packages/db-types` が package として存在し、typecheck script を持つ。
- [ ] `DbRowByTable` が `dbTableMetadata` の主要 table 名を覆う。
- [ ] insert/update helper 型が nullable/primary key の違いを表現する。
- [ ] API DSQL repository が DB row 型を query result boundary で参照する。
- [ ] source gate と docs が DB shared type 境界を検査・説明する。
- [ ] 選定した検証コマンドが pass し、実 DSQL introspection を実施済み扱いしていない。

## 検証計画

- `npm run typecheck -w @saphnexa/db-types`
- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck`
- `npm run docs:check`
- `npm run test:contract`
- `git diff --check`

## PR レビュー観点

- DB metadata と shared row type の table 名が drift しないこと。
- API DSQL repository の型参照が runtime behavior を偽装していないこと。
- 実 DSQL introspection / generated DB types 未実施の範囲が docs/report/PR コメントに残ること。

## リスク

- 今回の型は source metadata 由来の手動 shared type であり、実 Aurora DSQL introspection 由来の完全自動生成ではない。
- `packages/db-schema` は全 required table の metadata をまだ持っていないため、今回は metadata がある主要 table から開始する。

## 状態

do
