# 作業完了レポート

保存先: `reports/working/20260528-1351-aws-validation-command-separation.md`

## 1. 受けた指示

- 主な依頼: v0.17 実装を進め、AWS dev/UAT E2E・性能・RAG品質検証を実行可能にする。
- 今回の対象: validation raw output capture と final suite gate の循環を解消する。
- 条件: 実施していない実 AWS 検証を完了扱いにしない。修正タスク、RCA、検証、PR コメント、作業レポートを残す。

## 2. 要件整理

| 要件ID | 指示・要件 | 重要度 | 対応状況 |
|---|---|---:|---|
| R1 | validation raw capture plan が final suite gate を raw output 生成 command として直接呼ばない | 高 | 対応 |
| R2 | validation result capture helper の missing env / valid JSON / threshold failure を検査する | 高 | 対応 |
| R3 | `test:e2e:aws` / `perf:aws` / `rag:quality:aws` を validation evidence build 後の gate に戻す | 高 | 対応 |
| R4 | external action plan、runbook、local verification、CI/verify/Taskfile/docs check を同期する | 高 | 対応 |
| R5 | 実 AWS dev/UAT 検証を完了扱いにしない | 高 | 対応 |

## 3. 検討・判断したこと

- 既存の `test:e2e:aws`、`perf:aws`、`rag:quality:aws` は `dist/acceptance/aws_dev_uat_validation.json` を読む final gate なので、raw output capture command としては使わない方針にした。
- E2E / 性能 / RAG 品質の実行そのものは外部環境で行い、repo-local helper は実行済み結果を JSON raw output として検査・出力する役割に分離した。
- raw capture plan checker に、validation capture command が final suite gate npm script を直接呼ばない invariant を追加した。
- helper の stdout を fixture から安定して検査できるよう、capture output は同期 write に統一した。

## 4. 実施作業

- `capture-aws-dev-uat-e2e-result.js`、`capture-aws-dev-uat-performance-result.js`、`capture-aws-dev-uat-rag-quality-result.js` を追加した。
- `check-aws-dev-uat-validation-capture-helpers.js` を追加し、help、missing env、valid JSON、性能閾値未達を検査した。
- raw capture plan の validation commands を capture helper に差し替えた。
- external action plan を capture helper / validation raw checks / validation build / suite gates / final gate / bundle manifest の順序へ修正した。
- `package.json`、`Taskfile.yml`、CI workflow、docs check、runbook、local verification docs に fixture check と新順序を反映した。

## 5. 成果物

| 成果物 | 内容 |
|---|---|
| `tools/capture-aws-dev-uat-e2e-result.js` | E2E 実行済み結果を raw JSON として出力 |
| `tools/capture-aws-dev-uat-performance-result.js` | 性能実行済み結果を閾値検査して raw JSON として出力 |
| `tools/capture-aws-dev-uat-rag-quality-result.js` | RAG 品質実行済み結果を閾値検査して raw JSON として出力 |
| `tools/check-aws-dev-uat-validation-capture-helpers.js` | validation capture helper fixture check |
| `tools/aws-dev-uat-raw-capture-plan.js` | validation raw capture command の循環解消 |
| `docs/ops/runbooks/aws-dev-uat-validation.md` | 実行順序と helper env の更新 |

## 6. 実行した検証

- `npm run aws:dev-uat:validation-capture:fixture:check`: 初回 fail。capture output を同期 write に変更後 pass。
- `npm run aws:dev-uat:raw-capture-plan:check`: pass
- `npm run aws:dev-uat:capture-helpers:check`: pass
- `npm run acceptance:external-actions:check`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `task aws:dev-uat:validation-capture:fixture:check`: pass
- `git diff --check`: pass
- `npm run verify`: pass

## 7. 未対応・制約・リスク

- `aws sts get-caller-identity --output json`: fail。理由は `Unable to locate credentials`。AWS credentials がないため、実 AWS dev/UAT E2E・性能・RAG品質検証と実 evidence 作成は未実施。
- validation capture helper は、外部で完了した E2E・負荷試験・Bedrock Evaluations の結果を raw JSON 化する導線であり、実テストや評価 job を開始しない。
- 実提出時は helper env に実行済み結果を入れ、raw output files、raw input、final evidence、bundle manifest を同じ evidence package として保存する必要がある。

## 8. Fit評価

総合fit: 4.5 / 5.0（約90%）

理由: repo 内で準備可能な循環解消、capture helper、検査、docs/CI/verify 同期は完了した。AWS credentials と実環境がないため、実 dev/UAT 実行は未完了として残る。
