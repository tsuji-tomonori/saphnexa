# 作業完了レポート: CloudFormation inventory source schema gate

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` をもとに実装する。
- `.workspace/local.md` を参考にローカル確認する。
- `.workspace/Saphnexa_検収受入条件_package_v1.0` を満たすまで作業を継続する。
- リポジトリの worktree/task/PR/report/validation ルールに従う。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | CloudFormation inventory schema を final validator と同期する | 対応 |
| R2 | draft inventory と AWS final inventory の source 別 required 条件を明示する | 対応 |
| R3 | 空の `stack_outputs` / `stack_resources` を final schema 上も不足として表現する | 対応 |
| R4 | 既存の local draft check と final candidate fixture を弱めない | 対応 |
| R5 | 外部状態を変更しない | 対応 |

## 検討・判断の要約

- `tools/final-evidence-candidate.js` は AWS final inventory に `stack_id` / `stack_status` / `stack_outputs` / `stack_resources` を要求していた。
- 一方で `docs/acceptance/cloudformation/cloudformation_inventory.schema.json` は draft 専用 field を top-level required にしており、AWS final inventory の contract と一致していなかった。
- そのため、schema を common required と `source` 条件別 required に分け、`tools/check-cloudformation-inventory.js` に source 条件の static inspection を追加した。
- AWS CLI 実行、deploy、release、final checklist signoff は外部状態変更または外部証跡確定を伴うため実施していない。

## 実施作業

- CloudFormation inventory schema の top-level required を共通 field に限定した。
- `source: local-cdk-intent` の場合に `local_cdk_inventory` / `expected_major_resource_types` / `final_capture_instructions` を required とする conditional schema を追加した。
- `source: aws-cloudformation-inventory` の場合に `stack_id` / `stack_status` / `stack_outputs` / `stack_resources` を required とする conditional schema を追加した。
- `stack_status` の complete 系 enum、`stack_outputs` / `stack_resources` の `minItems: 1` を schema に追加した。
- `tools/check-cloudformation-inventory.js` で source 別 required 条件と acceptance eligibility 条件を検査するようにした。

## 成果物

| 成果物 | 内容 |
|---|---|
| `docs/acceptance/cloudformation/cloudformation_inventory.schema.json` | draft/final source 別 CloudFormation inventory schema |
| `tools/check-cloudformation-inventory.js` | schema source 条件の static check 追加 |
| `tasks/do/20260527-1844-cfn-inventory-source-schema-gate.md` | task 定義と検証結果 |
| `reports/working/20260527-1846-cfn-inventory-source-schema-gate.md` | 本レポート |

## 実行した検証

- `npm run cfn:inventory:check`: pass
- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run docs:check`: pass
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run verify`: pass

## 指示への fit 評価

総合fit: 4.6 / 5.0（約92%）

理由: final acceptance の外部証跡を受け取る前段の schema/validator 同期を改善し、検収条件に向けた preflight の誤判定リスクを下げた。AWS deploy、CloudFormation 実取得、release、final checklist signoff は確認を要する外部状態変更のため未実施であり、検収全体は未完了。

## 未対応・制約・リスク

- 未対応: Git tag / GitHub Release、AWS deploy / publish、CloudFormation `describe-stacks` / `list-stack-resources`、final evidence manifest、final checklist signoff。
- 制約: `.workspace` は作業 worktree ではなく元 worktree 配下の参照資料として確認した。
- リスク: 実際の AWS normalized inventory 作成時に、schema の `source` と required fields に合わせた整形が必要。
