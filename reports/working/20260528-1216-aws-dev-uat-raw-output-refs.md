# 作業完了レポート

保存先: `reports/working/20260528-1216-aws-dev-uat-raw-output-refs.md`

## 1. 受けた指示

- 主な依頼: v0.17 package に基づく本実装を継続し、AWS dev/UAT E2E・性能・RAG品質検証を実行できる状態へ近づける。
- 今回の対象: AWS dev/UAT raw input の `capture_provenance.commands[].output_ref` が raw output 本体を指すことを builder で検査する。
- 条件: 実施していない AWS 実行や検証を完了扱いにしない。

## 2. 要件整理

| 要件ID | 指示・要件 | 重要度 | 対応状況 |
|---|---|---:|---|
| R1 | `output_ref` を raw input ファイルからの相対パスとして検査する | 高 | 対応 |
| R2 | `output_ref` 参照先が存在しない場合に fail する negative path を追加する | 高 | 対応 |
| R3 | sample raw output files を追加し fixture check を通す | 高 | 対応 |
| R4 | runbook / local verification を同期する | 中 | 対応 |
| R5 | 変更範囲に見合う検証を実行する | 高 | 対応 |
| R6 | 実 AWS credentials と実 raw output がない状態を完了扱いにしない | 高 | 対応 |

## 3. 検討・判断したこと

- `capture_provenance` の文字列 metadata だけでは、final evidence が取得コマンドと raw output 本体の対応を検収できないため、builder が参照ファイルの存在を直接確認する形にした。
- `output_ref` は raw input ファイルからの相対パスに限定し、絶対パスと `..` traversal を禁止した。
- sample raw output は fixture 用の非機微データとして追加し、実 AWS output の証跡とは明確に分けた。
- AWS credentials が未設定のため、実 AWS dev/UAT 実行は引き続き未検証として扱った。

## 4. 実施した作業

- `tools/aws-dev-uat-evidence-builders.js` に `output_ref` の相対パス検査、traversal 禁止、参照先存在検査を追加した。
- `tools/check-aws-dev-uat-evidence-builders.js` に missing raw output ref の negative path を追加した。
- `docs/acceptance/evidence/raw/` に preflight / validation sample raw output files を追加した。
- `docs/ops/runbooks/aws-dev-uat-validation.md` と `docs/ops/local-verification.md` に raw output ref の要件を追記した。

## 5. 成果物

| 成果物 | 形式 | 内容 | 指示との対応 |
|---|---|---|---|
| `tools/aws-dev-uat-evidence-builders.js` | JavaScript | raw input の `output_ref` 実体検査 | R1 |
| `tools/check-aws-dev-uat-evidence-builders.js` | JavaScript | missing raw output ref negative path | R2 |
| `docs/acceptance/evidence/raw/` | sample evidence | fixture 用 raw output files | R3 |
| `docs/ops/runbooks/aws-dev-uat-validation.md` | Markdown | raw output ref 運用要件 | R4 |
| `docs/ops/local-verification.md` | Markdown | local verification 上の注意点 | R4 |

## 6. 実行した検証

- `npm run aws:dev-uat:evidence:fixture:check`: pass
- `npm run aws:dev-uat:preflight:build -- --input docs/acceptance/evidence/aws_dev_uat_preflight.capture.sample.json --output /tmp/saphnexa-aws-dev-uat-preflight.json`: pass
- `npm run aws:dev-uat:validation:build -- --input docs/acceptance/evidence/aws_dev_uat_validation.capture.sample.json --output /tmp/saphnexa-aws-dev-uat-validation.json`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass
- `node tools/check-aws-dev-uat-preflight.js /tmp/saphnexa-aws-dev-uat-preflight.json --require-final`: pass
- `node tools/check-aws-dev-uat-validation.js /tmp/saphnexa-aws-dev-uat-validation.json --require-final`: pass
- `npm run acceptance:package:check`: pass
- `npm run acceptance:external-actions:check`: pass
- `rg -n "[0-9]{12}|123456789012" docs/acceptance/evidence/raw docs/acceptance/evidence/*.capture.sample.json tools/aws-dev-uat-evidence-builders.js tools/check-aws-dev-uat-evidence-builders.js`: no matches
- `npm run verify`: pass

## 7. 未対応・制約・リスク

- `aws sts get-caller-identity --output json`: fail。AWS credentials が未設定で `Unable to locate credentials` となったため、実 AWS dev/UAT 実行は未実施。
- sample raw output files は fixture であり、AWS dev/UAT の最終検収証跡ではない。
- `npm run verify` 内の `acceptance:final-candidate:check` は `final evidence candidate not ready` を記録する。これは AWS 実証跡未取得を示す状態であり、今回の local verification pass と最終検収完了は別物である。

## 8. 指示へのfit評価

総合fit: 4.5 / 5.0（約90%）

理由: 今回の raw output ref 検査強化として必要な builder 実装、negative path、sample raw output、docs 同期、検証は完了した。一方で、全体目標である実 AWS dev/UAT E2E・性能・RAG品質検証は credentials 未設定のため未完了であり、最終検収 evidence はまだ作成できていない。
