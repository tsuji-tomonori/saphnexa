# rollback runbook

## 目的

deploy、migration、文書版有効化、成果物公開で問題が出たときに、影響範囲を限定して安全に戻す。

## 前提

- rollback 対象の commit、CloudFormation stack、DB migration version、文書版、成果物 version が特定されていること。
- データ破壊やアクセス権変更を伴う操作は実行前に責任者承認を得ること。

## 手順

1. 問題が code、infra、DB、document、artifact のどれに属するかを分類する。
2. code/infra は直前の安定 commit と stack diff を確認し、deploy rollback 方針を決める。
3. DB は forward fix を原則とし、破壊的 rollback が必要な場合は backup と承認を取得する。
4. 文書版は旧 active 版を再有効化し、新版を archived または failed にする。
5. 成果物は `published_artifacts` の latest pointer を安定版へ戻す。

## 検証

- 対象 URL/API/検索結果が安定版の挙動に戻っていること。
- migration 履歴、artifact pointer、document active version が矛盾していないこと。
- Blocker/Critical defect が再発していないこと。

## 証跡

- rollback 対象、承認者、実行者、実行時刻、diff、検証結果、残リスクを保存する。
