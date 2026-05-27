# 作業完了レポート: evidence manifest cdk version required

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` をもとに実装する。
- `.workspace/local.md` を参考にローカル確認する。
- `.workspace/Saphnexa_検収受入条件_package_v1.0` を満たすまで作業を継続する。
- リポジトリの worktree/task/PR/report/validation ルールに従う。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | evidence manifest schema の required と final validator を同期する | 対応 |
| R2 | `cdk_app_version` 欠落を schema/example check で検出する | 対応 |
| R3 | final candidate fixture の `cdk_app_version` 検査を弱めない | 対応 |
| R4 | 外部状態を変更しない | 対応 |

## 検討・判断の要約

- final evidence candidate validator は `manifest.cdk_app_version` を final text として検査していた。
- evidence manifest example と draft manifest builder も `cdk_app_version` を出力していた。
- 一方、schema の `required` と final acceptance extension required には `cdk_app_version` がなく、schema と validator の required contract がずれていた。
- そのため、schema required と check expected list を更新し、example manifest に `cdk_app_version` があることを明示的に検査した。

## 実施作業

- `docs/acceptance/evidence/evidence_manifest.schema.json` の `required` に `cdk_app_version` を追加した。
- `x_final_acceptance_extension.required` に `cdk_app_version` を追加した。
- extension reason を GitHub release URL と deployed CDK app version の両方を説明する内容へ更新した。
- `tools/check-evidence-manifest.js` の expected required list、extension required list、schema property check、example presence check を更新した。

## 成果物

| 成果物 | 内容 |
|---|---|
| `docs/acceptance/evidence/evidence_manifest.schema.json` | `cdk_app_version` required 化 |
| `tools/check-evidence-manifest.js` | schema/example check の同期 |
| `tasks/do/20260527-1911-evidence-manifest-cdk-version-required.md` | task 定義と検証結果 |
| `reports/working/20260527-1913-evidence-manifest-cdk-version-required.md` | 本レポート |

## 実行した検証

- `npm run evidence:check`: pass
- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run verify`: pass

## 指示への fit 評価

総合fit: 4.6 / 5.0（約92%）

理由: final manifest schema と final validator の required contract を同期し、最終証跡作成時の検出漏れを減らした。実 AWS 証跡、release、final checklist signoff は外部状態変更または外部確定を伴うため未実施であり、検収全体は未完了。

## 未対応・制約・リスク

- 未対応: Git tag / GitHub Release、AWS deploy / publish、CloudFormation `describe-stacks` / `list-stack-resources`、final evidence manifest、final checklist signoff。
- 制約: 今回は schema/check の同期であり、実 final manifest はまだ配置していない。
- リスク: final manifest 作成時は `cdk_app_version` を実際の deploy 対象 version として記録する必要がある。
