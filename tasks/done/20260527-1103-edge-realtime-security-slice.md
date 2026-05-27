# edge/realtime/security 静的検収スライス

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-27 11:03 JST
- 対象 PR: #1

## 背景

検収 trace では CloudFront Function、single entry route、WebSocket ticket、WAF/IAM/KMS/SQS/DLQ、cdk-nag が scaffolded のまま残っている。

## 目的

AWS 実環境なしで確認可能な edge/realtime/security/IaC intent を構造化 catalog と静的検査コマンドに落とし、検収 trace の根拠を増やす。

## スコープ

- infra construct metadata に edge routing、security、KMS、queue、IAM/cdk-nag intent を追加する。
- local static check で必須 intent と route/channel policy を検査する。
- package scripts、Taskfile、CI workflow、admin report、docs、traceability を同期する。
- 実 CloudFront Function、AppSync Events、WAF/IAM/KMS/SQS/DLQ、cdk-nag 実行はこのスライスでは行わない。

## 実装前チェックリスト

- [x] 既存 infra construct と security baseline を確認する。
- [x] edge route / single entry / CloudFront Function intent を検査する。
- [x] ws-ticket channel scope と realtime construct intent を検査する。
- [x] WAF/IAM/KMS/SQS/DLQ/cdk-nag intent を検査する。
- [x] docs/trace/CI/admin report のコマンド一覧を同期する。
- [x] 関連検証と `npm run verify` を通す。
- [x] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- `npm run edge:security:check` が CloudFront Function intent、admin artifact routes、single entry route、WebSocket channel scope、WAF/IAM/KMS/SQS/DLQ/cdk-nag intent を検査する。
- `docs/acceptance/traceability.md` で AC-035/036/044/047/048/082/083/085/086 のローカル根拠と未実施 AWS 制約が明確になる。
- `package.json`、`Taskfile.yml`、`.github/workflows/ci.yml`、`tools/build-admin-test-report.js`、`docs/ops/local-verification.md` が実装と同期している。
- 対象検証、docs/acceptance 検証、`npm run verify`、`git diff --check`、pre-commit が pass する。

## 受け入れ条件

- AC-035: CloudFront Function の viewer/internal routing intent を静的検査できる。
- AC-036/AC-085: single entry route/path intent を静的検査できる。
- AC-044: ws-ticket channel scope と realtime construct intent を静的検査できる。
- AC-047: CloudFront WAF baseline intent を静的検査できる。
- AC-048: IAM wildcard review と cdk-nag intent を静的検査できる。
- AC-082: KMS policy intent を静的検査できる。
- AC-083: security baseline intent を静的検査できる。
- AC-086: SQS/DLQ intent を静的検査できる。

## 検証計画

- `npm run edge:security:check`
- `npm run cdk:synth:local`
- `npm run security:scan`
- `npm run ci:check`
- `npm run docs:check`
- `npm run acceptance:check`
- `npm run admin-artifacts:build`
- `npm run artifacts:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## ドキュメント保守方針

- local verification docs に新規 edge/security 検証コマンドを追記する。
- traceability はローカル静的検証の根拠を反映し、AWS 実リソース確認と cdk-nag 実行は未実施として明記する。

## PR レビュー観点

- docs と実装の同期。
- security/access-control の境界を弱めていないこと。
- AWS 実体がない intent を実リソース検証済みとして表現していないこと。

## リスク・制約

- このスライスは static catalog 検査であり、AWS deployed resource、IAM policy simulator、cdk-nag 実行、AppSync Events 実接続の代替ではない。

## 実行した検証

- `npm run edge:security:check`: pass
- `npm run cdk:synth:local`: pass
- `npm run security:scan`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `npm run acceptance:check`: pass
- `npm run admin-artifacts:build`: pass
- `npm run artifacts:check`: pass
- `npm test`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files ...`: pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550631173
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550632989
