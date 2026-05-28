# 作業完了レポート

保存先: `reports/working/20260528-0937-edge-identity-realtime-binding.md`

## 1. 受けた指示

- 主な依頼: 基本設計 v0.17 をもとに 1-6 を進め、7. AWS dev/UAT E2E・性能・RAG 品質検証ができる状態にする。
- 今回の作業範囲: 4. CloudFront / Cognito / AppSync Events 実結合を進める。
- 条件: 実 CloudFront/Cognito/AppSync deploy、CloudFront Function test、AppSync logs、AWS dev/UAT E2E を実施済みとして書かない。

## 2. 要件整理

| 要件ID | 指示・要件 | 重要度 | 対応状況 |
|---|---|---:|---|
| R1 | CloudFront 単一入口に SPA / API / AppSync Events / admin artifacts origin を接続する | 高 | 対応 |
| R2 | `/api/*` と `/auth/*` を versioned API へ rewrite する | 高 | 対応 |
| R3 | Cognito UserPoolClient を OAuth code flow と CloudFront callback/logout URL に接続する | 高 | 対応 |
| R4 | AppSync Events の `chat` / `admin` namespace と ws-ticket 方針を接続する | 高 | 対応 |
| R5 | Docusaurus / Allure 管理成果物を CloudFront signed cookie KeyGroup に接続する | 高 | 対応 |
| R6 | 変更範囲に合う検証を実行する | 高 | 対応 |

## 3. 検討・判断したこと

- 基本設計 v0.17 の単一 CloudFront 方針に合わせ、binding source を `infra/cdk/edge-identity-realtime-bindings.js` に分離し、CDK source と local intent checker の両方から確認できる形にした。
- React には AWS 実ドメインを持たせず、CloudFront viewer path と route metadata だけを追加した。
- Cognito callback/logout URL は CloudFront distribution domain から作る構成にし、カスタムドメイン追加時は後続で URL 追加が必要であることをリスクとして残した。
- AppSync Events の channel pattern は v0.17 の `/{user_id}/chat/{chat_id}` 方針に寄せ、local ws-ticket scope も `/user-id/chat/*` へ更新した。

## 4. 実施した作業

- `infra/cdk/edge-identity-realtime-bindings.js` を追加し、origin、rewrite、admin artifact access、Cognito、AppSync Events namespace の binding source を定義。
- `infra/cdk/saphnexa-stack.ts` の CloudFront distribution に SPA / API / AppSync Events / admin artifacts origins と cache behaviors を追加。
- CloudFront Functions、WAF managed rules、OAC bucket policy、PublicKey / KeyGroup、trusted key group behavior を追加。
- Cognito UserPoolClient に OAuth code flow、callback/logout URL、scopes、UserPoolDomain を追加。
- AppSync Events namespace を `chat` / `admin` に整理し、ws-ticket / IAM publish mode を維持。
- local inventory、resource specs、CloudFormation inventory、Taskfile、npm scripts、docs、traceability を更新。
- local ws-ticket channel scope を基本設計 v0.17 に合わせて `/user-id/chat/*` へ更新。

## 5. 成果物

| 成果物 | 形式 | 内容 | 指示との対応 |
|---|---|---|---|
| `infra/cdk/edge-identity-realtime-bindings.js` | JS | Edge / Identity / Realtime binding source | CloudFront/Cognito/AppSync 実結合 |
| `infra/cdk/saphnexa-stack.ts` | TypeScript | CloudFront origins/behaviors、Cognito OAuth、AppSync namespace | 実 CDK source |
| `tools/check-edge-identity-realtime-bindings.js` | JS | binding source と CDK source の静的検査 | 検証導線 |
| `docs/ops/local-verification.md` | Markdown | local 確認範囲と未完了扱い | 誤完了防止 |
| `docs/acceptance/traceability.md` | Markdown | AC-020/035/044/085 の証跡説明更新 | traceability 同期 |

## 6. 指示への fit 評価

| 評価軸 | 評価 | 理由 |
|---|---|---|
| 指示網羅性 | 4 | CloudFront/Cognito/AppSync の source 結合は進めたが、実 deploy / logs / E2E は未実施 |
| 制約遵守 | 5 | AWS 実疎通を完了扱いにしていない |
| 成果物品質 | 4 | binding source と checker を追加し、既存 inventory/checker と同期した |
| 説明責任 | 5 | 未実施・制約・検証結果を明記した |
| 検収容易性 | 4 | `npm run edge:identity:realtime:check` と既存 checks で確認可能 |

総合fit: 4.4 / 5.0（約88%）

理由: 4 の実結合に向けた CDK/source/checker は具体化したが、AWS dev/UAT での実 CloudFront/Cognito/AppSync 疎通は未実施のため。

## 7. 実行した検証

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

## 8. 未対応・制約・リスク

- `aws-cdk-lib` / `constructs` install 後の実 `cdk synth` は未実施。
- CDK deploy、CloudFront Function test、Cognito hosted UI callback、AppSync Events subscribe/publish logs は未実施。
- CloudFront signed cookie の実 key pair、secret rotation、cookie 発行 Lambda 実装は後続で確認・実装が必要。
- AWS dev/UAT E2E・性能・RAG 品質検証はまだ実行可能状態の最終証跡には達していない。

## 9. 参照情報

- AWS CloudFormation `AWS::CloudFront::Distribution` DistributionConfig: https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-properties-cloudfront-distribution-distributionconfig.html
- AWS CloudFormation `AWS::CloudFront::Distribution` CacheBehavior: https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-properties-cloudfront-distribution-cachebehavior.html
- AWS CloudFormation `AWS::CloudFront::PublicKey`: https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-cloudfront-publickey.html
- AWS CloudFormation `AWS::CloudFront::KeyGroup`: https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-cloudfront-keygroup.html
- AWS CloudFormation `AWS::Cognito::UserPoolClient`: https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-cognito-userpoolclient.html
- AWS CloudFormation `AWS::AppSync::Api`: https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-appsync-api.html
- AWS CloudFormation `AWS::AppSync::ChannelNamespace`: https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-appsync-channelnamespace.html
