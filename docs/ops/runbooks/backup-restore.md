# backup / restore runbook

## 目的

DSQL、S3、設定、公開成果物、評価 artifacts の復旧手順と復旧試験の記録形式を定める。

## 前提

- 復旧対象環境、RTO/RPO、backup 時刻、対象 resource、復旧承認が確定していること。
- 復旧試験は本番データを破壊しない隔離環境で実行すること。

## 手順

1. DSQL schema migration version と backup snapshot または export を確認する。
2. S3 raw/parsed/user-import/evaluation/admin artifacts の versioning と lifecycle を確認する。
3. 設定値、KMS key、CloudFront distribution、AppSync/Cognito 設定の inventory を取得する。
4. 隔離環境に restore し、migration checksum と主要整合性クエリを確認する。
5. 代表チャット、文書 retrieval、管理成果物閲覧、評価 report 参照を smoke する。

## 検証

- RTO/RPO が記録され、復旧試験が 1 回以上成功していること。
- 復旧後に ACL leakage、missing artifact、migration mismatch がないこと。
- evidence manifest に DR test report URL を反映できること。

## 証跡

- backup ID、restore target、RTO/RPO、migration checksum、S3 inventory、smoke 結果、DR test report を保存する。
