# CloudFront / Cognito / AppSync Events 実結合

## 背景

ユーザーは基本設計 v0.17 をもとに、4. CloudFront / Cognito / AppSync Events 実結合、5. Bedrock KB / S3 Vectors / AgentCore 実結合、6. Docusaurus / Allure公開まで進め、7. AWS dev/UAT E2E・性能・RAG 品質検証ができる状態を求めている。

前回までに AWS dev/UAT preflight、Hono/Zod/OpenAPI entrypoint、CDK 実 Construct source は追加済み。ただし `EdgeStaticConstruct` の CloudFront distribution は空 origin に近く、Cognito callback/logout、AppSync Events channel namespace、admin artifacts signed cookie の結合が source/checker として弱い。

## 目的

CloudFront の単一入口に SPA、REST API、AppSync Events、Docusaurus/Allure 管理成果物を結び、Cognito OAuth と AppSync Events ws-ticket 方針を同じ binding source から検査できるようにする。

## スコープ

- Edge / Identity / Realtime の binding source を追加する。
- CDK source の CloudFront distribution origins、ordered cache behavior、CloudFront Functions、signed cookie key group、Cognito OAuth callback/logout、AppSync Events namespace を実結合寄りに更新する。
- local inventory / checker / docs を更新し、実 AWS deploy 未実施の範囲を明確にする。
- 実 `cdk synth`、CDK deploy、CloudFront/AppSync/Cognito 実疎通は未実施。未実施を pass として扱わない。

## タスク種別

機能追加

## 参照した設計・公式情報

- 基本設計 v0.17: 単一CloudFront、`/api/*` -> `/v1/*`、`/auth/*` -> `/v1/auth/*`、`/event/realtime*` -> AppSync Events、Docusaurus/Allure は admin artifacts bucket + CloudFront signed cookie。
- AWS CloudFormation `AWS::CloudFront::Distribution` DistributionConfig / CacheBehavior docs。
- AWS CloudFormation `AWS::CloudFront::KeyGroup` / `AWS::CloudFront::PublicKey` docs。
- AWS CloudFormation `AWS::Cognito::UserPoolClient` OAuth docs。
- AWS CloudFormation `AWS::AppSync::Api` / `AWS::AppSync::ChannelNamespace` docs。

## 計画

1. Edge / Identity / Realtime binding source を追加する。
2. `infra/cdk/saphnexa-stack.ts` の CloudFront, Cognito, AppSync Events 定義を binding source に合わせる。
3. resource spec / local inventory / CloudFormation inventory を更新する。
4. `edge:identity:realtime:check` を追加し、CloudFront rewrite、origin/behavior、Cognito OAuth、AppSync namespace を検査する。
5. docs と作業レポートを更新し、関連検証を実行する。

## ドキュメント保守計画

- `docs/ops/local-verification.md` に Edge/Identity/Realtime binding 検査を追記する。
- 実 CloudFront/Cognito/AppSync deploy と疎通は未完了扱いで残す。

## 受け入れ条件

- CloudFront distribution source に SPA、API、AppSync Events、admin artifacts の origin と ordered cache behavior がある。
- CloudFront Function source が `/`、`/api/*`、`/auth/*`、`/admin/docs/*`、`/admin/test-reports/*` の rewrite を保持する。
- Cognito UserPoolClient が OAuth code flow、callback URL、logout URL、openid/email/profile scope を持つ。
- AppSync Events が `chat` / `admin` namespace、ws-ticket authorizer、IAM publish mode を持つ。
- admin artifacts は CloudFront signed cookie 用 PublicKey / KeyGroup と trusted key group behavior に接続される。
- `npm run edge:identity:realtime:check`、`npm run cdk:constructs:check`、`npm run cdk:synth:local`、`npm run cfn:inventory:build`、`npm run cfn:inventory:check`、`npm run edge:security:check`、`npm run docs:check`、`git diff --check` が pass する。

## 検証計画

- `npm run edge:identity:realtime:check`
- `npm run cdk:constructs:check`
- `npm run cdk:synth:local`
- `npm run cfn:inventory:build`
- `npm run cfn:inventory:check`
- `npm run edge:security:check`
- `npm run scan:bundle-domains`
- `npm run docs:check`
- `git diff --check`

## 実施結果

- `infra/cdk/edge-identity-realtime-bindings.js` を追加し、CloudFront origin / rewrite、Cognito OAuth、AppSync Events namespace、admin artifacts signed cookie KeyGroup を binding source として定義した。
- `infra/cdk/saphnexa-stack.ts` に SPA、API、AppSync Events、admin artifacts の CloudFront origins / ordered cache behaviors を追加した。
- `/api/*`、`/auth/*`、admin artifact paths の CloudFront Function rewrite source を追加した。
- Cognito UserPoolClient に OAuth code flow、callback/logout URL、openid/email/profile scope、UserPoolDomain を追加した。
- AppSync Events namespace を `chat` / `admin` にし、ws-ticket subscribe authorizer / IAM publish mode を維持した。
- local ws-ticket channel scope を基本設計 v0.17 の `/{user_id}/chat/*` 方針に更新した。
- local inventory、CloudFormation inventory、Taskfile、npm scripts、docs、traceability を更新した。

## 検証結果

- `npm run edge:identity:realtime:check`: pass
- `npm run cdk:constructs:check`: pass
- `npm run cdk:synth:local`: pass
- `npm run cdk:diff:local`: pass
- `npm run cfn:inventory:build`: pass
- `npm run cfn:inventory:check`: pass
- `npm run edge:security:check`: pass
- `npm run scan:bundle-domains`: pass
- `npm run docs:check`: pass
- `npm run acceptance:check`: pass
- `npm run test:integration:local`: pass
- `npm run test:e2e:local`: pass
- `npm run test:contract`: pass
- `npm run api:openapi:check`: pass
- `npm test`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm run web:flow:check`: pass
- `git diff --check`: pass

## 作業レポート

- `reports/working/20260528-0937-edge-identity-realtime-binding.md`

## PR

- PR: https://github.com/tsuji-tomonori/saphnexa/pull/2
- 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4559853715
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4559855716

## PR レビュー観点

- React に execute-api / appsync-api / appsync-realtime-api の実ドメインを入れていないこと。
- CloudFront の `/api/*` と `/auth/*` が versioned API へ rewrite されること。
- `/event/realtime*` が AppSync Events origin へ分離されること。
- 管理成果物 path が KeyGroup trusted behavior に入っていること。
- 実 AWS deploy / CloudFront Function test / AppSync logs を完了扱いにしていないこと。

## リスク

- `aws-cdk-lib` install 後の実 `cdk synth` は未実施のため、L1 property のサービス側 validation は後続で確認が必要。
- Cognito callback URL は CloudFront distribution domain に依存するため、カスタムドメイン採用時は callback/logout URL を追加する必要がある。

## 状態

done
