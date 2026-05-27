# trace local status 正規化

- 状態: done
- タスク種別: ドキュメント更新
- 作成日時: 2026-05-27 11:13 JST
- 対象 PR: #1

## 背景

検収 trace に `implemented_unverified` として残っている項目の一部は、ローカル検証コマンドと CI 証跡が既に存在する。AWS 実公開・実接続が未実施である制約は残しつつ、ローカルで検証済みの状態を正しく表す必要がある。

## 目的

`docs/acceptance/traceability.md` の状態を、ローカル検証済み項目は `local_verified`、AWS 実環境が必要な範囲は制約として明記する形に正規化する。

## スコープ

- AC-020/021/070/087/088/122/126 の状態を再確認し、ローカル根拠と未実施 AWS 制約を明記する。
- 実装変更は行わない。
- 最終検収・GitHub release・AWS publish・実 deploy は行わない。

## 実装前チェックリスト

- [x] 対象 AC の既存根拠コマンドを確認する。
- [x] trace の状態と文言を更新する。
- [x] docs/acceptance 検証を実行する。
- [x] 作業レポートを作成する。
- [x] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- 対象 AC が local evidence と AWS 制約を分けて記載される。
- `npm run docs:check`、`npm run acceptance:check`、`git diff --check`、pre-commit が pass する。
- 作業レポート、commit/push、PR コメント、task done 移動が完了する。

## 受け入れ条件

- AC-020/021: local artifact access policy は検証済み、CloudFront Cookie/Allure 実公開は未実施として記載される。
- AC-070: local Flyway SQL/schema checks は検証済み、Aurora DSQL/Flyway 実適用は未実施として記載される。
- AC-087/088/126: local docs/test report artifact と CI job は検証済み、Docusaurus/Allure/CloudFront/S3 publish は未実施として記載される。
- AC-122: local integration は検証済み、AWS 実結合は未実施として記載される。

## 検証計画

- `npm run docs:check`
- `npm run acceptance:check`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## リスク・制約

- 状態整理のみであり、AWS 実環境の未実施項目は解消しない。

## 実行した検証

- `npm run docs:check`: pass
- `npm run acceptance:check`: pass
- `git diff --check`: pass
- `pre-commit run --files ...`: pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550660328
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550662291
