# final artifact deployment source gate 作業レポート

## 指示・目的

- `Saphnexa_基本設計書_v0.16.md`、`local.md`、検収受入条件 package に沿って、final acceptance に向けた実装とローカル検証を継続する。
- final acceptance の外部残件を完了扱いせず、ローカルで強化できる gate を追加する。
- repo ルールに従い task、検証、commit、PR コメント、作業レポートを残す。

## 要件整理

| 要件ID | 要件 | 対応 |
|---|---|---|
| R1 | final manifest artifact URL が CloudFormation inventory の deployment source と整合することを検査する | 対応 |
| R2 | 無関係な公開 host / S3 bucket を拒否する fixture を追加する | 対応 |
| R3 | ready fixture を壊さない | 対応 |
| R4 | final acceptance の外部残件を完了扱いしない | 対応 |

## 検討・判断

- docs / Allure / RAG evaluation の URL は public URL と path suffix だけでは、第三者の bucket / host を混入できる余地がある。
- CloudFormation inventory には `DistributionDomainName` と `AdminArtifactsBucketArn` が含まれるため、final artifact URL の配置先をこの capture 結果と突き合わせるのが検収証跡として自然と判断した。
- CloudFront alias custom domain は現時点の inventory output からは検証できないため、基本設計の CloudFront distribution domain と S3 admin artifacts bucket を許可元とした。

## 実施作業

- `tools/final-evidence-candidate.js`
  - `validateManifestArtifactDeploymentSources` を追加した。
  - manifest の test report / docs / RAG evaluation artifact URL が、CloudFormation inventory の `DistributionDomainName` または `AdminArtifactsBucketArn` と同じ配置元を指すことを検査するようにした。
- `tools/check-final-evidence-candidate-fixtures.js`
  - ready fixture の S3 artifact bucket を CloudFormation inventory の `AdminArtifactsBucketArn` と一致させた。
  - 無関係な HTTPS host と S3 bucket を設定した `unknownArtifactDeploymentSource` fixture を追加した。
- `tasks/do/20260527-2132-final-artifact-deployment-source-gate.md`
  - 受け入れ条件、Done 条件、検証計画を明記した。

## 実行した検証

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass。final files 未配置のため status は `not_ready` のまま。
- `npm run acceptance:package:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files tools/check-final-evidence-candidate-fixtures.js tools/final-evidence-candidate.js tasks/do/20260527-2132-final-artifact-deployment-source-gate.md`: pass

## 成果物

| 成果物 | 内容 |
|---|---|
| `tools/final-evidence-candidate.js` | final artifact deployment source gate |
| `tools/check-final-evidence-candidate-fixtures.js` | 無関係な deployment source 拒否 fixture |
| `tasks/do/20260527-2132-final-artifact-deployment-source-gate.md` | task 管理 |
| `reports/working/20260527-2134-final-artifact-deployment-source-gate.md` | 本レポート |

## Fit 評価

総合fit: 4.6 / 5.0

理由: final manifest artifact URL と CloudFormation capture 結果の整合をローカル検査へ追加し、targeted check と `npm run verify` まで pass した。一方で、final acceptance 自体は Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final checklist signoff が未完了のため、完了扱いにはできない。

## 未対応・制約・リスク

- 未対応: Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence manifest/checklist 作成、検収者 signoff。
- 制約: 外部状態を変更する操作はユーザー確認が必要なため未実施。
- リスク: CloudFront alias custom domain を final artifact URL として使う場合は、CloudFormation inventory に alias output を追加するか、検査側の許可元を拡張する必要がある。
