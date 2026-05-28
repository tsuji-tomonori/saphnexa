# CDK 実 Construct 化

## 背景

ユーザーは基本設計 v0.17 をもとに、3. CDK 実Construct化、4. CloudFront / Cognito / AppSync Events 実結合、5. Bedrock KB / S3 Vectors / AgentCore 実結合、6. Docusaurus / Allure 公開まで進め、7. AWS dev/UAT E2E・性能・RAG 品質検証ができる状態を求めている。

現状の `infra/constructs/*` は local intent catalog であり、ADR でも「実 CDK construct ではなく、7 Construct 責務を inventory source として置いた」と明記されている。前回までに AWS dev/UAT preflight と Hono/Zod/OpenAPI entrypoint は追加したが、CloudFormation resource type と CDK construct source の接続が不足している。

## 目的

7 Construct を実 CDK source と CloudFormation resource type inventory に接続し、DSQL、CloudFront/Cognito/AppSync Events、Bedrock KB/S3 Vectors/AgentCore、Docusaurus/Allure 公開基盤の synth/deploy 証跡へ進める状態にする。

## スコープ

- `infra/cdk/` に実 CDK `Construct` source を追加する。
- 現行 AWS CloudFormation resource type に基づく required resource inventory を追加する。
- local CDK inventory / CloudFormation inventory draft / checker を更新する。
- 実 `cdk synth`、`cdk deploy`、AWS account への作成は未実施。ただし未実施を pass として扱わない。

## タスク種別

機能追加

## 参照した公式情報

- AWS::DSQL::Cluster
- AWS::AppSync::Api / AWS::AppSync::ChannelNamespace
- AWS::S3Vectors::VectorBucket / AWS::S3Vectors::Index
- AWS::Bedrock::KnowledgeBase
- AWS::BedrockAgentCore::Runtime

## 計画

1. CloudFormation resource type inventory を追加する。
2. 実 CDK construct source を追加し、7 Construct class と主要 `CfnResource` を定義する。
3. existing local inventory と CloudFormation draft に resource type 情報を接続する。
4. `cdk:constructs:check` を追加し、resource type と construct source を検査する。
5. docs と作業レポートを更新し、検証を実行する。

## ドキュメント保守計画

- `docs/ops/local-verification.md` に CDK construct source / resource type inventory の検査を追記する。
- 実 deploy 未実施のため、完了扱いにしない項目を明記する。

## 受け入れ条件

- `infra/cdk/saphnexa-stack.ts` に 7 Construct class があり、`Construct` を継承している。
- DSQL、CloudFront、Cognito、AppSync Events、S3 Vectors、Bedrock KB、AgentCore、Docusaurus/Allure 用 admin artifacts bucket の CloudFormation resource type が inventory に含まれる。
- `npm run cdk:constructs:check` が construct source と resource type inventory を検査して pass する。
- `npm run cdk:synth:local` / `npm run cfn:inventory:build` / `npm run cfn:inventory:check` が更新後も pass する。
- `npm run docs:check`、`git diff --check` を実行し、結果を記録する。

## 検証計画

- `npm run cdk:constructs:check`
- `npm run cdk:synth:local`
- `npm run cfn:inventory:build`
- `npm run cfn:inventory:check`
- `npm run docs:check`
- `git diff --check`

## 実施結果

- `infra/cdk/saphnexa-stack.ts` を追加し、7 Construct class と主要 `CfnResource` を定義した。
- `infra/cdk/resource-specs.js` を追加し、Construct ごとの CloudFormation resource type と output inventory を正本化した。
- `infra/constructs/*`、`infra/bin/app.js`、CloudFormation inventory builder/checker を更新し、local intent と実 CDK resource type inventory を接続した。
- `infra/package.json` を追加し、`aws-cdk-lib` / `constructs` / `aws-cdk` / `typescript` 依存を宣言した。
- `tools/check-cdk-real-constructs.js` と `npm run cdk:constructs:check` を追加した。
- `docs/ops/local-verification.md` に local で確認できる CDK 実 Construct source と未完了扱いを追記した。

## 検証結果

- `npm run cdk:constructs:check`: pass
- `npm run cdk:synth:local`: pass
- `npm run cfn:inventory:build`: pass
- `npm run cfn:inventory:check`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass
- `npm run test:contract`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass

## 作業レポート

- `reports/working/20260528-0919-cdk-real-constructs.md`

## PR

- PR: https://github.com/tsuji-tomonori/saphnexa/pull/2
- 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4559773416
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4559775060

## PR レビュー観点

- 実 AWS deploy 証跡なしで AC-081 や AWS 実結合を完了扱いにしていないこと。
- AppSync Events は GraphQL API ではなく `AWS::AppSync::Api` / `ChannelNamespace` として扱っていること。
- S3 Vectors、Bedrock KB、AgentCore は CloudFormation resource type と preflight output に接続できること。
- Docusaurus/Allure 公開は admin artifacts bucket と CloudFront 管理者限定 path として表現していること。

## リスク

- `aws-cdk-lib` / `constructs` install と `cdk synth` 実行は未実施。
- L1 `CfnResource` の詳細 properties は deploy 前に実アカウント/サービス制約に合わせて追加調整が必要。

## 状態

done
