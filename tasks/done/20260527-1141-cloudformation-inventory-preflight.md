# CloudFormation inventory preflight

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-27 11:41 JST
- 対象 PR: #1

## 背景

検収 trace の残件に `AC-081` CloudFormationリソース数がある。これは検収環境の `CloudFormation describe-stacks` と infra inventory の照合が必要で、ローカルだけでは完了扱いにできない。

## 目的

AWS deploy 前に、最終検収で必要な CloudFormation inventory 証跡の draft 生成・schema 検査・運用手順を追加し、AC-081 を実行可能な外部証跡待ちに狭める。

## スコープ

- local CDK intent から `dist/acceptance/cloudformation_inventory.draft.json` を生成する。
- draft inventory が最終検収証跡ではないこと、実 AWS capture が必要なことを機械的に検査する。
- final AWS inventory の保存先、必須フィールド、検証方法を schema/runbook/docs に残す。
- `package.json`、Taskfile、CI、admin report、docs check、acceptance package draft と同期する。
- AWS deploy、AWS CLI 実行、Git tag/release 作成、最終 checklist 署名は実行しない。

## 実装チェックリスト

- [x] CloudFormation inventory draft 生成スクリプトを追加する。
- [x] CloudFormation inventory check を追加する。
- [x] acceptance package draft に CloudFormation inventory draft を含める。
- [x] docs/trace/local verification/CI/admin report/Taskfile を同期する。
- [x] 対象検証と `npm run verify` を通す。
- [x] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- `npm run cfn:inventory:build` が `dist/acceptance/cloudformation_inventory.draft.json` を生成する。
- `npm run cfn:inventory:check` が draft inventory の必須フィールド、construct/resource/output coverage、`final_acceptance_eligible=false`、AWS capture pending を検査する。
- `npm run acceptance:package:build` / `npm run acceptance:package:check` が CloudFormation inventory draft を package に含めて検査する。
- `docs/acceptance/cloudformation/cloudformation_inventory.schema.json` と runbook/docs に final AWS inventory の提出・検査方法が残る。
- `AC-081` は実 AWS CloudFormation inventory 未取得のため `requires_aws` のまま、根拠が draft/check/runbook へ更新される。
- `npm run verify`、`git diff --check`、pre-commit が pass する。

## 受け入れ条件

- AC-081: infra inventory と CloudFormation describe-stacks の照合に必要な schema と draft package を用意できる。ただし検収環境の CloudFormation 実証跡がない限り PASS 扱いしない。
- AC-002: 成果物 package draft に CloudFormation inventory draft を含め、最終 CloudFormation outputs/inventory が未実施であることを明示する。

## 検証計画

- `npm run cfn:inventory:build`
- `npm run cfn:inventory:check`
- `npm run acceptance:package:build`
- `npm run acceptance:package:check`
- `npm run ci:check`
- `npm run docs:check`
- `npm run acceptance:check`
- `npm run admin-artifacts:build`
- `npm run artifacts:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## リスク・制約

- 実 AWS CloudFormation stack はこの作業では取得しない。AC-081、AC-150、AC-151、AC-152 は引き続き `requires_aws`。
- AWS CLI 実行や deploy/release は外部状態変更を伴うため、このタスクでは実行しない。
