# AWS dev/UAT raw input dry-run checker 作業レポート

## 指示

`Saphnexa_基本設計書_v0.17_package.zip` をもとに、1〜6 の本実装を進め、7 の AWS dev/UAT E2E・性能・RAG品質検証ができるようにする。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | preflight raw input を final evidence 作成前に dry-run 検査できる | 対応 |
| R2 | validation raw input を suite final gate 相当で dry-run 検査できる | 対応 |
| R3 | scaffold と `pending_capture` raw input を reject する | 対応 |
| R4 | npm scripts、Taskfile、CI、verify、external action plan、docs に反映する | 対応 |
| R5 | 実 AWS dev/UAT E2E・性能・RAG品質検証を完了する | 未対応。AWS credentials 不在 |

## 検討・判断

- dry-run checker は `dist/acceptance/` を更新せず、一時ディレクトリに evidence を生成して既存 final checker を通す設計にした。
- scaffold は draft であり、`schema_version: saphnexa-aws-dev-uat-raw-input-scaffold.v1` や `pending_capture` を残した入力は dry-run 前に reject する。
- validation は `all` に加え、`e2e`、`performance`、`rag-quality` の suite gate も dry-run で通す。

## 実施作業

- `tools/aws-dev-uat-raw-input-checker.js` を追加し、preflight / validation raw input dry-run を実装。
- `tools/check-aws-dev-uat-raw-input.js` と `tools/check-aws-dev-uat-raw-input-fixtures.js` を追加。
- `package.json`、`Taskfile.yml`、`.github/workflows/ci.yml`、CI/docs/external action checker を更新。
- `docs/ops/runbooks/aws-dev-uat-validation.md` と `docs/ops/local-verification.md` に dry-run 手順と制約を追記。

## 成果物

| 成果物 | 内容 |
|---|---|
| `tools/aws-dev-uat-raw-input-checker.js` | raw input dry-run checker の共通実装 |
| `tools/check-aws-dev-uat-raw-input.js` | operator raw input を dry-run 検査する CLI |
| `tools/check-aws-dev-uat-raw-input-fixtures.js` | sample raw input positive path と scaffold rejection の fixture check |

## 検証

- `npm run aws:dev-uat:raw-input:fixture:check`: pass
- `npm run aws:dev-uat:raw-input-scaffold:check`: pass
- `npm run acceptance:external-actions:check`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `task aws:dev-uat:raw-input:fixture:check`: pass
- `git diff --check`: pass
- `npm run verify`: pass
- `aws sts get-caller-identity --output json`: fail。`Unable to locate credentials.` のため実 AWS identity は未確認。

## Fit 評価

総合fit: 4.4 / 5.0（約88%）

理由: 実 AWS raw input を最終 evidence へ書く前に検査する導線を追加し、7 の実行失敗を早期発見しやすくした。実 AWS credentials がないため、dev/UAT の実検証完了証跡はまだ作成できていない。

## 未対応・制約・リスク

- AWS credentials がないため、DSQL/Flyway 実適用、CDK deploy、Docusaurus/Allure 実 publish、AWS dev/UAT E2E・性能・RAG品質検証の実行結果は未取得。
- dry-run fixture は sample raw input の構造確認であり、最終検収 evidence ではない。
- 実 raw input の `output_ref` 参照先 raw output file が不足している場合、dry-run は fail する。
