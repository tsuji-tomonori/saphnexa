# Admin 文書登録 metadata fields 境界

- 状態: do
- タスク種別: 機能追加
- 作成日時: 2026-05-29 20:48
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: #3

## 背景

Admin 文書登録フォームは `createDocument` route helper / generated operation helper を使い、PDF ファイル名、版ラベル、ACL scope までは送信できる。一方、`docs/ops/local-verification.md` では文書種別と有効期間が未接続として残っている。既存 `createDocument` は `metadata` を受け取れるため、新規 public route を増やさず metadata fields を接続できる。

## 目的

文書登録フォームから文書種別、有効開始日、有効終了日を入力し、`createDocument` の `metadata` に `document_type` / `valid_from` / `valid_until` として送信・保存する。実 PDF upload、ACL 編集、取り込みジョブ詳細、実 S3 / KB ingestion は未接続として残す。

## スコープ

- Web `DocumentRegistrationForm`
- Web `useCreateDocument`
- local store の default metadata
- local/source/UI/a11y/docs gates

## 対象外

- Public API route 追加
- 実 PDF upload
- ACL 編集 UI
- 取り込みジョブ詳細 UI
- 実 S3 / KB ingestion
- 実ブラウザ E2E
- 実 Aurora DSQL SQL 実行

## 受け入れ条件

- [ ] 文書登録フォームが文書種別、有効開始日、有効終了日を入力できる。
- [ ] Web は `createDocument` request の `metadata` に `document_type` / `valid_from` / `valid_until` を含める。
- [ ] local store の default metadata も文書種別と有効期間を保存する。
- [ ] local integration / web flow gate が metadata の保存を確認する。
- [ ] docs/source/UI/a11y gates 上で文書種別と有効期間は接続済みになり、実 PDF upload、ACL 編集、取り込みジョブ詳細は未接続として残る。
- [ ] 選定した検証コマンドが pass する。

## 実装計画

1. `DocumentRegistrationForm` に文書種別、有効開始日、有効終了日 field を追加する。
2. `useCreateDocument` が入力値から `metadata` を構築して `createDocument` へ送る。
3. local store の default metadata に同じ field を含める。
4. local/source/UI/a11y/docs gates を同期する。
5. 変更範囲に応じた typecheck / flow / integration / docs / build checks を実行する。

## ドキュメントメンテナンス計画

- `docs/ops/local-verification.md` の Admin 文書登録フォーム項目を、文書種別と有効期間が local/source gate 接続済みである状態へ更新する。
- 実 PDF upload、ACL 編集、取り込みジョブ詳細は未接続として残す。

## 検証計画

- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck:source`
- `npm run web:flow:check`
- `npm run ui:check`
- `npm run web:a11y:check`
- `npm run test:integration:local`
- `npm test`
- `npm run docs:check`
- `npm run web:build:check`
- `git diff --check`

## PR セルフレビュー観点

- UI が架空 metadata を表示せず、入力値を API request に渡していること。
- metadata が local store / document version に保存されること。
- 実 PDF upload、ACL 編集、取り込みジョブ詳細を完了扱いしていないこと。
