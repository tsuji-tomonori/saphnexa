# Admin user import boundary

## 背景

`.workspace` の基本設計では、FR-ADMIN-USER-001〜004 として、管理者が CSV/Excel でユーザーを一括登録・更新・削除し、成功件数、失敗件数、行別エラー理由、反映日時を確認できることが定義されている。
現行 PR #3 では `adminListUsers` / `startUserImport` / `getUserImport` API contract と local API はあるが、Web Admin からユーザー一覧・取込開始・取込結果確認を行う UI 境界は未実装である。

## 目的

Admin Dashboard にユーザー管理タブを追加し、既存 `adminListUsers` / `startUserImport` / `getUserImport` API を generated operation helper / route helper 経由で使う。CSV/Excel 実アップロードではなく、local/source gate 用の JSON rows 入力で一括取込境界を確認できるようにする。

## タスク種別

機能追加

## スコープ

- `apps/web` に `useAdminUsers` hook、`useUserImport` hooks を追加する。
- `apps/web` に `UserImportPanel` と `UserTable` を追加する。
- Admin Dashboard に「ユーザー」タブを追加する。
- local API / DSQL repository の `adminListUsers` / `getUserImport` 境界を必要範囲で補強する。
- UI/source/web/docs gate を更新する。
- CSV/Excel binary upload、S3 import file 配置、Cognito 実反映、取込完了通知の実 AppSync 配信は今回の対象外とする。

## 実装計画

1. `useAdminUsers` / `useStartUserImport` / `useUserImportResult` を API client generated helper と route helper で実装する。
2. `UserImportPanel` を React Hook Form + Zod + shared UI components で実装する。
3. `UserTable` を `DataTable` で実装する。
4. Admin Dashboard にユーザータブを追加する。
5. local API / DSQL repository と source/UI/web/docs gate を更新する。
6. Web/API/source/docs/build/local integration/diff check を実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Admin ユーザー取込は JSON rows 入力で `startUserImport` / `getUserImport` API 境界を source gate で確認すること、CSV/Excel upload / Cognito 実反映 / AppSync 通知は別途であることを追記する。

## 受け入れ条件

- [x] Admin UI が `adminListUsers` / `startUserImport` / `getUserImport` route helper / generated operation helper 経由でユーザー一覧・取込開始・結果確認を行う。
- [x] ユーザー取込 UI が React Hook Form + Zod と共通 UI components を使い、JSON rows の empty/error/pending/result state を表示する。
- [x] 取込成功後に `adminListUsers` と対象 `user-import` query が再取得され、架空ユーザーや固定件数を表示しない。
- [x] local API / DSQL repository / source/UI/web/docs gate が Admin ユーザー取込境界を検査する。
- [x] 選定した検証コマンドが pass し、CSV/Excel binary upload、S3 import file 配置、Cognito 実反映、AppSync 通知を実施済み扱いしない。

## 検証計画

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck -w @saphnexa/db-types`
- `npm run ui:check`
- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run typecheck:source`
- `npm run docs:check`
- `npm run web:build:check`
- `npm run test:integration:local`
- `git diff --check`

## 検証結果

- `npm run typecheck -w @saphnexa/api`: fail -> 修正後 pass
- `npm run typecheck -w @saphnexa/web`: pass
- `npm run typecheck -w @saphnexa/db-types`: pass
- `npm run ui:check`: pass
- `npm run web:flow:check`: pass
- `npm run web:a11y:check`: pass
- `npm run typecheck:source`: pass
- `npm run docs:check`: pass
- `npm run web:build:check`: pass
- `npm run test:integration:local`: pass
- `git diff --check`: pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4571027055
- セルフレビュー結果: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4571027061

## PR レビュー観点

- Web UI が架空ユーザーや固定件数を表示していないこと。
- `adminListUsers` / `startUserImport` / `getUserImport` が API client generated operation helper と route helper を通ること。
- CSRF token がない状態では取込開始できないこと。
- CSV/Excel upload / Cognito 実反映 / AppSync 通知を実装済みに見せていないこと。

## リスク

- この slice は local/API 境界として JSON rows を扱うものであり、CSV/Excel binary upload の実装ではない。
- local store のユーザー反映であり、実 Cognito や外部 ID 基盤への反映証跡ではない。

## 状態

done
