# ユーザー取込失敗対応 runbook

## 目的

CSV/XLSX ユーザー一括取込で不正行、部分失敗、致命的失敗が発生したときに、行別結果を確認し再実行可能な状態に戻す。

## 前提

- 対象 `import_id`、入力 file URI、result S3 prefix、管理者操作ログが分かっていること。
- ユーザー登録、更新、削除の期待件数が確認できること。

## 手順

1. `user_import_jobs` の status と result S3 prefix を確認する。
2. `user_import_rows` で失敗行、error message、適用済み行を確認する。
3. 入力 file の schema、必須列、メール重複、削除対象存在有無を確認する。
4. 修正済み file で再取込を開始する。
5. 行別結果 report を管理者に共有する。

## 検証

- 登録、更新、削除、不正行の 4 ケースが期待状態であること。
- 一般ユーザーが管理 API にアクセスできないこと。
- 失敗行 report が S3 result prefix に存在すること。

## 証跡

- import ID、入力 checksum、行別結果 report、API response、監査ログ、確認者、確認日を保存する。
