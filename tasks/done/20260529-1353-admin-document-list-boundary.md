# Admin document list boundary

## 背景

`.workspace` の基本設計では、管理者が PDF 文書を登録し、登録文書の公開範囲や取り込み状況を確認することが管理 UI の主要要件になっている。
現行 PR #3 では API contract / API client に `adminListDocuments` があるが、Web Admin 画面ではまだ文書一覧を使っておらず、local API dispatcher と DSQL repository の admin document list 境界も弱い。

## 目的

既存 `adminListDocuments` API を Web Admin の実データ由来 UI に接続し、local API / DSQL query plan / source gate で文書一覧境界を確認できるようにする。

## タスク種別

機能追加

## スコープ

- `apps/web` に `useAdminDocuments` hook と `DocumentTable` を追加する。
- Admin Dashboard の Tabs に「文書」タブを追加し、`adminListDocuments` の結果または正直な empty state を表示する。
- `apps/api/src/local-api.js` と `packages/domain/src/store.js` に admin document list/get の local fixture 境界を追加する。
- `apps/api/src/repositories/dsql/apiRepository.ts` に `adminListDocuments` query plan を追加する。
- UI/source/web flow/docs gate を更新する。
- 文書登録フォーム、PDF upload、取り込みジョブ詳細 UI は今回の対象外とする。

## 実装計画

1. domain store と local API に `listDocuments` / `getDocument` を追加する。
2. DSQL repository に admin document list query plan と mapper を追加する。
3. Web hook / table / Admin Dashboard tab を追加する。
4. source/UI/web/docs gate を更新する。
5. API/Web/UI/source/docs/build/diff check を実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Admin 文書一覧が `adminListDocuments` route helper / DSQL query plan / Web hook で確認されることと、文書登録・PDF upload は別途であることを追記する。

## 受け入れ条件

- [ ] Admin UI が `adminListDocuments` route helper / generated operation helper 経由で文書一覧を取得する。
- [ ] Admin Dashboard に「文書」タブがあり、API response 由来の文書だけを `DataTable` で表示し、空の場合は正直な empty state を出す。
- [ ] local API と DSQL repository が admin document list 境界を持ち、管理者ロール境界を弱めない。
- [ ] source/UI/web flow/docs gate が Admin 文書一覧境界を検査する。
- [ ] 選定した検証コマンドが pass し、PDF upload / 文書登録フォームを実施済み扱いしない。

## 検証計画

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck -w @saphnexa/web`
- `npm run ui:check`
- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run typecheck:source`
- `npm run docs:check`
- `npm run web:build:check`
- `git diff --check`

## PR レビュー観点

- Web UI が架空文書や固定件数を表示していないこと。
- `adminListDocuments` が API client generated operation helper と route helper を通ること。
- local API と DSQL query plan の admin role boundary が弱まっていないこと。
- 未実装の PDF upload / 文書登録フォームを実装済みに見せていないこと。

## リスク

- この slice は文書一覧境界であり、PDF upload、文書登録、取り込み監視、ACL 編集の実 UI は未対応。
- local fixture に文書がない初期状態では empty state が表示される。

## 状態

do
