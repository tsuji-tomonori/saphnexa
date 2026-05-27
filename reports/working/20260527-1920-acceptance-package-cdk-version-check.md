# 作業完了レポート: acceptance package cdk version check

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` をもとに実装する。
- `.workspace/local.md` を参考にローカル確認する。
- `.workspace/Saphnexa_検収受入条件_package_v1.0` を満たすまで作業を継続する。
- リポジトリの worktree/task/PR/report/validation ルールに従う。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | draft package checker が `cdk_app_version` を必須 field として検査する | 対応 |
| R2 | draft manifest の `cdk_app_version` が `package.json` version と一致することを検査する | 対応 |
| R3 | schema required の `github_release_url` も required loop に含める | 対応 |
| R4 | draft package の external pending 状態を維持する | 対応 |
| R5 | 外部状態を変更しない | 対応 |

## 検討・判断の要約

- evidence manifest schema は `cdk_app_version` を required としている。
- `tools/build-acceptance-package.js` は draft manifest に `cdk_app_version: packageJson.version` を出力している。
- `tools/check-acceptance-package.js` は draft manifest の required loop で `cdk_app_version` を検査していなかった。
- そのため、draft package checker に `cdk_app_version` と `github_release_url` の required check、`cdk_app_version` と `package.json` version の一致 check を追加した。

## 実施作業

- `tools/check-acceptance-package.js` で `package.json` を読み込むようにした。
- draft manifest required field loop に `github_release_url` と `cdk_app_version` を追加した。
- `manifest.cdk_app_version === packageJson.version` を検査する assertion を追加した。
- final pending markers と final readiness false の既存検査は維持した。

## 成果物

| 成果物 | 内容 |
|---|---|
| `tools/check-acceptance-package.js` | draft manifest CDK app version required/consistency check |
| `tasks/do/20260527-1919-acceptance-package-cdk-version-check.md` | task 定義と検証結果 |
| `reports/working/20260527-1920-acceptance-package-cdk-version-check.md` | 本レポート |

## 実行した検証

- `npm run acceptance:package:check`: pass
- `npm run evidence:check`: pass
- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run verify`: pass

## 指示への fit 評価

総合fit: 4.6 / 5.0（約92%）

理由: evidence schema と draft package checker の required contract を同期し、`cdk_app_version` の package-level consistency を検査できるようにした。実 AWS 証跡、release、final checklist signoff は外部状態変更または外部確定を伴うため未実施であり、検収全体は未完了。

## 未対応・制約・リスク

- 未対応: Git tag / GitHub Release、AWS deploy / publish、CloudFormation `describe-stacks` / `list-stack-resources`、final evidence manifest、final checklist signoff。
- 制約: 今回は draft package checker の同期であり、実 final manifest はまだ配置していない。
- リスク: package version と CDK app version の対応を変更する場合は、draft manifest builder と checker を同時に更新する必要がある。
