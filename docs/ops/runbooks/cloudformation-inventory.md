# CloudFormation Inventory Runbook

## 目的

AC-081 の最終検収で、基本設計の infra inventory と検収環境の CloudFormation outputs/resource inventory が一致することを確認する。

## 前提

- 対象 stack 名、AWS account、region、検収対象 Git tag が evidence manifest に確定していること。
- AWS CLI は検収環境の読み取り権限で実行すること。
- ローカル draft は `npm run cfn:inventory:build` で生成できるが、最終検収証跡ではない。

## 手順

1. `npm run cfn:inventory:build` を実行し、`dist/acceptance/cloudformation_inventory.draft.json` を生成する。
2. `npm run cfn:inventory:check` を実行し、draft が最終証跡ではないことと、必要な AWS capture 手順が含まれることを確認する。
3. 検収環境で `aws cloudformation describe-stacks --stack-name saphnexa-uat-app --region ap-northeast-1 --output json` を取得する。
4. 検収環境で `aws cloudformation list-stack-resources --stack-name saphnexa-uat-app --region ap-northeast-1 --output json` を取得する。
5. describe-stacks と list-stack-resources の結果を `docs/acceptance/cloudformation/cloudformation_inventory.uat.json` に正規化して保存する。
6. 主要 CloudFormation resource type、stack outputs、StackStatus、StackId を基本設計の infra inventory と照合する。
7. 一致率 100% のみ AC-081 PASS とし、差分があれば `requires_aws` のまま defect として記録する。

## 検証

- `npm run cfn:inventory:check` が pass すること。
- `docs/acceptance/cloudformation/cloudformation_inventory.uat.json` が `docs/acceptance/cloudformation/cloudformation_inventory.schema.json` の required fields を満たすこと。
- `StackStatus` が成功系状態であること。
- 主要リソース一致率が 100% であること。

## 証跡

- `dist/acceptance/cloudformation_inventory.draft.json`
- `docs/acceptance/cloudformation/cloudformation_inventory.uat.json`
- `evidence_manifest.json` の `cloudformation_stacks`
- GitHub Actions run URL
- 検収 checklist の AC-081 行
