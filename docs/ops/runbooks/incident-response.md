# 障害対応 runbook

## 目的

Saphnexa の API、RAG、通知、取り込み、評価、管理成果物公開で障害が発生したときの初動、切り分け、報告、復旧確認を標準化する。

## 前提

- 対象環境、commit SHA、CloudFormation stack、直近 deploy、影響ユーザー範囲を確認できること。
- CloudWatch Logs、GitHub Actions、S3 admin artifacts、DSQL migration 履歴への閲覧権限があること。

## 手順

1. 影響範囲を API、Web、RAG、通知、取り込み、評価、成果物公開に分類する。
2. `trace_id` または `correlation_id` で CloudWatch Logs と DB event を検索する。
3. 直近 deploy、migration、設定変更、外部 AWS service 障害の有無を確認する。
4. データ損失、ACL 漏えい、RAG 根拠なし回答、運用不能の疑いがある場合は Blocker/Critical として扱う。
5. 回避策、rollback、再実行、アクセス遮断のどれを行うかを判断し、実施者と時刻を記録する。

## 検証

- 影響を受けた API または UI シナリオで再現しないこと。
- 関連する `chat_message_events`、`tool_invocations`、監査ログに欠落がないこと。
- 必要に応じて `npm run verify` と対象 smoke を再実行すること。

## 証跡

- incident ID、発生時刻、復旧時刻、commit SHA、trace_id、検証コマンド、CloudWatch Logs query、関連 PR/issue を記録する。
