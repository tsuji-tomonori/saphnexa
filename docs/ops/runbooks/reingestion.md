# 再取り込み runbook

## 目的

文書取り込み失敗または文書版更新後に、raw PDF、metadata、parsed artifacts、KB/S3 Vectors、DSQL 状態を整合させて再取り込みする。

## 前提

- 対象 `document_id`、`version_id`、`ingestion_job_id`、raw S3 URI、metadata URI が分かっていること。
- 管理者権限と取り込み worker の実行状況を確認できること。

## 手順

1. `ingestion_jobs` の状態、失敗理由、対象 S3 prefix を確認する。
2. raw PDF と metadata の存在、checksum、ACL scope を確認する。
3. 既存 parsed artifacts と BM25F/reference manifest の重複有無を確認する。
4. 再実行 API または worker retry を実行し、状態を `queued` から進める。
5. 成功後に旧版が検索対象から除外され、新版だけが active であることを確認する。

## 検証

- `ingestion_jobs.status=succeeded` であること。
- `document_versions` に active 版が 1 件だけ存在すること。
- ACL 許可ユーザーだけが retrieval 結果を取得できること。

## 証跡

- job ID、S3 inventory、DSQL query、worker logs、RAG retrieval test、実行者、実行日を保存する。
