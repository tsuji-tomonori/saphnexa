# Final Acceptance Runbook

## 目的

AC-001、AC-002、AC-004、AC-150、AC-151、AC-152 の最終検収で、draft や placeholder ではなく実証跡を提出する。

## 前提

- Git tag と GitHub release が作成済みであること。
- AWS UAT 環境への deploy と publish が完了していること。
- CloudFormation、Flyway、docs/Allure、RAG 評価、cost estimate の実証跡 URL が取得済みであること。
- 検収者が final checklist を確認・署名できること。

## 手順

1. `docs/acceptance/final/evidence_manifest.json` を作成し、Git tag、GitHub release URL、AWS account、CloudFormation stack、DB migration、docs/Allure、RAG 評価、cost estimate を実値で記録する。
2. `docs/acceptance/final/acceptance_checklist.csv` を作成し、`docs/acceptance/source/acceptance_catalog.json` の `source_columns` と同じ列で全 AC 行の `結果`、`証跡リンク`、`確認者`、`確認日` を記入する。
3. CloudFormation 実取得結果を raw JSON として保存し、normalizer で `docs/acceptance/cloudformation/cloudformation_inventory.uat.json` を作成する。
   - `aws cloudformation describe-stacks --stack-name saphnexa-uat-app --region ap-northeast-1 --output json > docs/acceptance/cloudformation/raw/describe-stacks.uat.json`
   - `aws cloudformation list-stack-resources --stack-name saphnexa-uat-app --region ap-northeast-1 --output json > docs/acceptance/cloudformation/raw/list-stack-resources.uat.json`
   - `CFN_CAPTURED_AT=<capture-iso-timestamp> npm run cfn:inventory:normalize`
4. `npm run acceptance:final-candidate:fixture:check` を実行し、validator が ready/invalid の両分岐を検査できる状態であることを確認する。
5. `npm run acceptance:final:fixture:check` を実行し、final candidate ready 後に readiness gate が complete へ遷移できることを確認する。
6. `npm run acceptance:final-candidate:check` を実行し、final candidate が ready になることを確認する。
7. `npm run acceptance:final:build` と `npm run acceptance:final:check` を実行し、readiness gate が final candidate の状態を反映することを確認する。
8. `npm run acceptance:package:build` と `npm run acceptance:package:check` を実行し、最終 package に証跡を含める。

## 検証

- final evidence manifest に placeholder、draft、example、pending が含まれないこと。
- final evidence manifest の `cdk_app_version`、`db_migration.tool`、`db_migration.latest_version`、`cost_estimate.assumption` が空ではなく、draft/pending 値ではないこと。
- final evidence manifest の `cost_estimate.monthly_usd` は数値で、0 以上 550 以下であること。
- AWS account id は実 12 桁であること。
- final evidence manifest の `git_commit_sha` は検証実行時の Git ref と一致していること。
- final evidence manifest の `git_tag` は repository に存在し、検証実行時の Git ref と同じ commit を指していること。
- draft package の `git_commit_sha` は検証実行時の Git ref と一致していること。
- GitHub release URL が検収対象 repository の `https://github.com/<owner>/<repo>/releases/tag/<git_tag>` として、final evidence manifest の `git_tag` と同じ tag を指すこと。
- final evidence manifest の全 `cloudformation_stacks` は、stack ARN 内の account、region、stack name が manifest の `aws_account_id`、`aws_region`、`stack_name` と一致すること。
- final evidence manifest と CloudFormation inventory が同じ AWS account、region、environment、stack name、stack ARN を指していること。
- final CloudFormation inventory の `capture_evidence` に `captured_at`、`describe-stacks` command、`list-stack-resources` command が記録されていること。
- final CloudFormation inventory の `stack_status` が complete 系 status で、`stack_outputs` が 1 件以上あり、各 output に `OutputKey` と `OutputValue` があること。
- final CloudFormation inventory の `stack_resources` が 1 件以上あり、各 resource に `LogicalResourceId`、`PhysicalResourceId`、`ResourceType`、complete 系 `ResourceStatus` があること。
- final CloudFormation inventory の `stack_resources[].ResourceType` が、local CDK intent で定義した主要 resource type を全件含むこと。
- checklist は source checklist 列を保ち、全 AC 行が `結果=PASS` で、`証跡リンク` が `https://` または `s3://` URL、`確認者` が final reviewer 名、`確認日` が `YYYY-MM-DD` の実在日付かつ未来日でないこと。
- CloudFormation inventory は `source=aws-cloudformation-inventory`、`final_acceptance_eligible=true` であること。

## 証跡

- `docs/acceptance/final/evidence_manifest.json`
- `docs/acceptance/final/acceptance_checklist.csv`
- `docs/acceptance/cloudformation/cloudformation_inventory.uat.json`
- `dist/acceptance/final_candidate_status.json`
- `dist/acceptance/final_readiness.json`
- GitHub release URL
- GitHub Actions run URL
