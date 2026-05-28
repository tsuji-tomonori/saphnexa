# AWS dev/UAT 検証 readiness 実装

状態: implemented_pending_pr_comment

## 背景

ユーザー依頼の本実装ロードマップ 7「AWS dev/UAT E2E・性能・RAG品質検証」を実行可能にする。既存の `aws:dev-uat:preflight` は、deploy/publish/migration などの前提証跡を検査するが、E2E・性能・RAG品質の AWS 実行結果を受け取る証跡契約と `test:e2e:aws` / `perf:aws` / `rag:quality:aws` の gate が不足している。

## 目的

AWS dev/UAT で E2E、性能、RAG品質検証を実行した後、結果を最終 evidence として機械検証できる状態を作る。実 AWS 実行自体は外部 state と認証情報が必要なため、このタスクでは実行せず、証跡 contract / checker / docs / scripts を追加する。

## タスク種別

機能追加

## スコープ

- AWS dev/UAT 検証結果 JSON の fixture と checker を追加する。
- `test:e2e:aws`、`perf:aws`、`rag:quality:aws` の final evidence gate を追加する。
- runbook、local verification、traceability、CI/docs check と同期する。
- 実 AWS deploy、負荷試験、E2E ブラウザ操作、Bedrock Evaluations 実行は未実施として扱う。

## 実施計画

1. 既存 preflight と acceptance criteria の閾値を確認する。
2. AWS dev/UAT validation evidence fixture と checker を実装する。
3. npm scripts / Taskfile / docs check / runbook / traceability を更新する。
4. 関連ローカル検証を実行し、作業レポートを残す。
5. commit/push、PR 受け入れ条件コメント、セルフレビュー、task done 移動まで行う。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に、preflight 後の E2E/perf/RAG quality evidence 作成と checker 実行手順を追記する。
- `docs/ops/local-verification.md` に fixture check と final check の扱いを明記する。
- `docs/acceptance/traceability.md` に AC-098、AC-123、AC-130〜AC-133 の AWS 証跡 gate を反映する。

## 受け入れ条件

- [x] AWS dev/UAT E2E・性能・RAG品質結果の evidence fixture が存在する。
- [x] `test:e2e:aws`、`perf:aws`、`rag:quality:aws` が final evidence を検査する script として定義される。
- [x] local fixture check は pass するが、final evidence なしでは完了扱いにしない設計になっている。
- [x] E2E pass 100%、非AI API p95 <= 800ms、質問開始 p95 <= 2s、初回通知 p95 <= 5s、最終回答 p95 <= 60s、timeout rate < 2%、RAG品質閾値を checker が検査する。
- [x] runbook / local verification / traceability / docs check が更新される。
- [x] 変更に見合う検証を実行し、作業レポートに結果と未実施 AWS 実行を記録する。
- [ ] PR に受け入れ条件確認とセルフレビューコメントを追加できる。

## 検証計画

- `npm run aws:dev-uat:validation:check`
- `npm run docs:check`
- `npm run acceptance:check`
- `npm run acceptance:source:check`
- `npm run aws:dev-uat:preflight`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `git diff --check`

## PR レビュー観点

- fixture pass を final AWS 検証完了と誤認させないこと。
- final evidence checker が、実 E2E・性能・RAG品質の閾値を緩めていないこと。
- 実 AWS 実行が必要な command を未実施のまま pass として記載していないこと。

## リスク

- `test:e2e:aws` / `perf:aws` / `rag:quality:aws` は、このタスクでは実 AWS テストを起動せず、実行結果 evidence を検査する gate として追加する。
- 実ブラウザ E2E、負荷試験、Bedrock Evaluations 実行は、AWS 認証情報、対象環境、テストユーザー、実 CloudFront URL が揃った段階で実施する必要がある。
