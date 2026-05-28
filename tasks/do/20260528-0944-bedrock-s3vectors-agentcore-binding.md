# Bedrock KB / S3 Vectors / AgentCore 実結合

## 背景

ユーザーは基本設計 v0.17 をもとに、5. Bedrock KB / S3 Vectors / AgentCore 実結合、6. Docusaurus / Allure公開まで進め、7. AWS dev/UAT E2E・性能・RAG 品質検証ができる状態を求めている。

前回までに CDK 実 Construct source と CloudFront / Cognito / AppSync Events binding は追加済み。ただし RAG 側は `AWS::Bedrock::KnowledgeBase`、`AWS::S3Vectors::*`、`AWS::BedrockAgentCore::*` の resource type はあるものの、S3 Vectors field mapping、DataSource ingestion、AgentCore Runtime env、AgentCore Gateway target、Tools API / ACL precheck との結合が source/checker として弱い。

## 目的

Bedrock Knowledge Base、S3 Vectors、AgentCore Runtime / Gateway を、Tools API、ACL precheck、DSQL、artifact buckets、ingestion/evaluation queue に結び、AWS dev/UAT RAG 品質検証へ進める source-level 証跡を追加する。

## スコープ

- Bedrock / S3 Vectors / AgentCore binding source を追加する。
- CDK source の Knowledge Base、S3 Vectors、AgentCore Runtime、Gateway、Gateway Target、queues/workers/env を binding source に合わせる。
- local RAG tools metadata と checker を追加し、ACL precheck と tool contract から AgentCore Gateway target へつながることを検査する。
- 実 Bedrock KB sync、S3 Vectors query、AgentCore Runtime/Gateway deploy/invoke は未実施。未実施を pass として扱わない。

## タスク種別

機能追加

## 参照した設計・公式情報

- 基本設計 v0.17: Bedrock KB + S3 Vectors、AgentCore Runtime / Gateway、Tools API、ACL precheck、SQS/DLQ、評価 run。
- AWS CloudFormation `AWS::Bedrock::KnowledgeBase` docs。
- AWS CloudFormation `AWS::Bedrock::DataSource` VectorIngestionConfiguration docs。
- AWS CloudFormation `AWS::S3Vectors::VectorBucket` / `AWS::S3Vectors::Index` docs。
- AWS CloudFormation `AWS::BedrockAgentCore::Runtime` docs。
- AWS CloudFormation `AWS::BedrockAgentCore::Gateway` / `GatewayTarget` docs。

## 計画

1. Bedrock / S3 Vectors / AgentCore binding source を追加する。
2. CDK source の Data/RagProcessing resources と outputs を binding source に合わせる。
3. AgentCore Gateway target、runtime env、KB field mapping、S3 Vectors metadata を追加する。
4. `rag:aws-binding:check` を追加し、binding source、CDK source、tools contract、local RAG ACL precheck を検査する。
5. docs と作業レポートを更新し、関連検証を実行する。

## ドキュメント保守計画

- `docs/ops/local-verification.md` に Bedrock/S3Vectors/AgentCore binding 検査を追記する。
- `docs/acceptance/traceability.md` の RAG/AWS binding 関連行を更新する。
- 実 Bedrock KB / S3 Vectors / AgentCore 実行は未完了扱いで残す。

## 受け入れ条件

- Bedrock KB が S3 Vectors storage、embedding model、metadata field mapping、ACL metadata fields を binding source と CDK source で持つ。
- S3 Vectors bucket/index が dimension、distance metric、metadata fields、KMS encryption を binding source と inventory に持つ。
- AgentCore Runtime が Tools API endpoint、Knowledge Base ID、S3 Vector index、DSQL endpoint、ACL precheck enabled の env を持つ。
- AgentCore Gateway / GatewayTarget が MCP protocol、AWS_IAM authorizer、Tools API OpenAPI target と接続される。
- ingestion/evaluation queues と workers が KB/DataSource/AgentCore binding に接続される。
- local RAG tools が `kb-retrieve` 前後で ACL precheck / postcheck を維持し、benchmark expected phrase や dataset 固有分岐を増やしていない。
- `npm run rag:aws-binding:check`、`npm run cdk:constructs:check`、`npm run cdk:synth:local`、`npm run cfn:inventory:build`、`npm run cfn:inventory:check`、`npm run rag:quality:check`、`npm run rag:security:check`、`npm run docs:check`、`git diff --check` が pass する。

## 検証計画

- `npm run rag:aws-binding:check`
- `npm run cdk:constructs:check`
- `npm run cdk:synth:local`
- `npm run cfn:inventory:build`
- `npm run cfn:inventory:check`
- `npm run rag:quality:check`
- `npm run rag:security:check`
- `npm run test:integration:local`
- `npm run docs:check`
- `git diff --check`

## 実施結果

- `infra/cdk/rag-runtime-bindings.js` を追加し、embedding、S3 Vectors、KB、DataSource、AgentCore、queue binding を定義した。
- `infra/cdk/saphnexa-stack.ts` に Bedrock KB role、S3 Vectors field mapping、Bedrock DataSource ingestion config、AgentCore runtime env、Gateway、GatewayTarget、worker env、SQS/DLQ redrive を追加した。
- `AWS::BedrockAgentCore::GatewayTarget` と RAG IAM roles を resource specs / CloudFormation inventory に追加した。
- `tools/check-rag-aws-bindings.js` と `npm run rag:aws-binding:check` を追加した。
- local RAG flow が `kb-retrieve` 後に `acl-check` を通し、`evidence-pack` 前に denied candidate を落とすことを検査した。
- `docs/ops/local-verification.md` と `docs/acceptance/traceability.md` を更新した。

## 検証結果

- `npm run rag:aws-binding:check`: pass
- `npm run cdk:constructs:check`: pass
- `npm run cdk:synth:local`: pass
- `npm run cfn:inventory:build`: pass
- `npm run cfn:inventory:check`: pass
- `npm run rag:quality:check`: pass
- `npm run rag:security:check`: pass
- `npm run test:integration:local`: pass
- `npm run test:e2e:local`: pass
- `npm run test:contract`: pass
- `npm test`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass

## 作業レポート

- `reports/working/20260528-0952-bedrock-s3vectors-agentcore-binding.md`

## PR レビュー観点

- Bedrock KB / S3 Vectors / AgentCore の source 結合を進めつつ、実 AWS 実行を完了扱いにしていないこと。
- RAG の根拠性、ACL precheck/postcheck、引用整合性を弱めていないこと。
- benchmark 期待語句、QA sample 固有値、dataset 固有分岐を実装に入れていないこと。
- Tools API は React/一般ユーザーから直接呼べる公開経路にしていないこと。

## リスク

- AgentCore GatewayTarget の最終 property は実 `aws-cdk-lib` / CloudFormation validation と AWS dev/UAT deploy で再確認が必要。
- S3 Vectors / Bedrock KB の field mapping はサービス側仕様に合わせた deploy-time 調整が必要になる可能性がある。

## 状態

in_progress
