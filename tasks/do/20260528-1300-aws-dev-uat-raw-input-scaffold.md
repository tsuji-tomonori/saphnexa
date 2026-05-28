# AWS dev/UAT raw input scaffold

- 状態: doing
- タスク種別: 機能追加
- 対象ブランチ: `codex/aws-dev-uat-preflight`
- 対象PR: #2

## 背景

AWS dev/UAT の preflight / validation 証跡は raw capture plan と evidence builder が整備済みだが、実AWS実行後に builder へ渡す raw input JSON の骨格を作る機械的な導線が不足している。

## 目的

raw capture plan に基づく raw input scaffold を生成・検査できるようにし、オペレータが実AWS出力を収集したあと、最終 evidence build へ進める入力構造を迷わず作れる状態にする。

## スコープ

- preflight / validation の raw input scaffold generator を追加する。
- scaffold が最終証跡ではなく、未捕捉状態であることを checker で保証する。
- npm scripts / verify / CI / docs / external acceptance actions に組み込む。
- 実AWS deploy、実AWS検証、外部公開、負荷試験実行はこのタスクでは行わない。

## 実施計画

1. raw capture plan と evidence builder の既存契約を確認する。
2. scaffold builder / CLI / checker を追加する。
3. package scripts、CI check、docs check、external action check、verify に組み込む。
4. runbook と local verification docs を更新する。
5. targeted checks と verify を実行し、結果をレポートへ記録する。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に scaffold の利用手順と「最終証跡ではない」制約を追記する。
- `docs/ops/local-verification.md` にローカル検証コマンドを追記する。

## 受け入れ条件

- [ ] `npm run aws:dev-uat:raw-input-scaffold:check` で preflight / validation scaffold の構造を検査できる。
- [ ] scaffold は `captured` や final evidence と誤認されない未捕捉状態を明示する。
- [ ] raw capture plan の command id / command / output_ref と scaffold の capture provenance が一致する。
- [ ] `npm run verify` に scaffold check が含まれる。
- [ ] CI workflow / docs check / external acceptance actions に scaffold check が反映される。
- [ ] runbook と local verification docs に利用手順と制約が記載される。

## 検証計画

- `npm run aws:dev-uat:raw-input-scaffold:check`
- `npm run aws:dev-uat:raw-capture-plan:check`
- `npm run acceptance:external-actions:check`
- `npm run ci:check`
- `npm run docs:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json` は認証状態確認として実行し、失敗時は未実施扱いにせず制約として記録する。

## PRレビュー観点

- scaffold がサンプル値や mock 値を final evidence として混入させないこと。
- raw capture plan と builder の command id 契約を弱めていないこと。
- 実AWS操作を checker が実行しないこと。

## リスク

- 実AWS認証情報がない場合、最終的な dev/UAT E2E・性能・RAG品質検証は完了できない。
- scaffold は入力作成補助であり、AWS上の本番証跡そのものではない。
