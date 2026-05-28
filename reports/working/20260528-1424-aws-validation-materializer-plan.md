# 作業完了レポート

保存先: `reports/working/20260528-1424-aws-validation-materializer-plan.md`

## 1. 受けた指示

- 主な依頼: v0.17 実装を進め、AWS dev/UAT E2E・性能・RAG品質検証を実行可能にする。
- 今回の対象: validation raw input materializer を raw capture plan と scaffold の機械可読導線へ反映する。
- 条件: 実施していない実 AWS 検証を完了扱いにしない。作業タスク、検証、PR コメント、作業レポートを残す。

## 2. 要件整理

| 要件ID | 指示・要件 | 重要度 | 対応状況 |
|---|---|---:|---|
| R1 | validation raw capture plan が materializer command を明示する | 高 | 対応 |
| R2 | materializer command が raw output/input check と build 前の導線として検査される | 高 | 対応 |
| R3 | validation scaffold の operator notes が materializer 実行と scaffold 非 final evidence を明示する | 高 | 対応 |
| R4 | raw capture plan / scaffold / docs check が materializer command を要求する | 高 | 対応 |
| R5 | 実 AWS dev/UAT 検証を完了扱いにしない | 高 | 対応 |

## 3. 検討・判断したこと

- external action plan と runbook だけでなく、operator が参照する `aws_dev_uat_raw_capture_plan.json` 自体に materializer command を入れる方針にした。
- validation mode には `finalization_order` を追加し、raw output capture 後に materialize、raw output check、raw input check、build、final gate へ進む順序を検査可能にした。
- scaffold には `materialization` セクションを追加し、scaffold 自体を final evidence にしない警告を維持した。

## 4. 実施作業

- `tools/aws-dev-uat-raw-capture-plan.js` の validation mode に `materialize_command`、raw output/input check command、`finalization_order` を追加した。
- `tools/check-aws-dev-uat-raw-capture-plan.js` で materializer command と順序を必須検査にした。
- `tools/aws-dev-uat-raw-input-scaffold.js` と `tools/check-aws-dev-uat-raw-input-scaffold.js` に validation materialization 情報と検査を追加した。
- runbook、local verification、docs check を materializer plan と同期した。

## 5. 成果物

| 成果物 | 内容 |
|---|---|
| `tools/aws-dev-uat-raw-capture-plan.js` | validation materializer command と finalization order を生成 |
| `tools/check-aws-dev-uat-raw-capture-plan.js` | materializer command と実行順を検査 |
| `tools/aws-dev-uat-raw-input-scaffold.js` | validation scaffold に materialization セクションを追加 |
| `docs/ops/runbooks/aws-dev-uat-validation.md` | raw capture plan と materializer 手順を同期 |
| `docs/ops/local-verification.md` | local verification の説明を materializer plan へ同期 |

## 6. 実行した検証

- `npm run aws:dev-uat:raw-capture-plan:check`: pass
- `npm run aws:dev-uat:raw-input-scaffold:check`: pass
- `npm run aws:dev-uat:validation-raw-input:fixture:check`: pass
- `npm run acceptance:external-actions:check`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass
- `npm run verify`: pass

## 7. 未対応・制約・リスク

- `aws sts get-caller-identity --output json`: fail。理由は `Unable to locate credentials`。AWS credentials がないため、実 AWS dev/UAT E2E・性能・RAG品質検証と実 evidence 作成は未実施。
- materializer command は raw capture plan に記載されるが、plan build/check は外部コマンドを実行しない。
- 実提出時は plan の command を実 raw output files に対して実行し、raw output check、raw input dry-run、validation build/final、bundle manifest check を通す必要がある。

## 8. Fit評価

総合fit: 4.6 / 5.0（約92%）

理由: repo 内で準備可能な validation materializer plan、scaffold、検査、docs 同期は完了した。AWS credentials と実環境がないため、実 dev/UAT 実行は未完了として残る。
