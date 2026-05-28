# AWS dev/UAT raw output content checker 作業レポート

## 指示

`Saphnexa_基本設計書_v0.17_package.zip` をもとに、1〜6 の本実装を進め、7 の AWS dev/UAT E2E・性能・RAG品質検証ができるようにする。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | preflight raw output の JSON/text 形式を検査できる | 対応 |
| R2 | validation raw output の JSON/text 形式を検査できる | 対応 |
| R3 | JSON parse 不能または空 JSON を fail できる | 対応 |
| R4 | text output の空ファイルを fail できる | 対応 |
| R5 | npm scripts、Taskfile、CI、verify、external action plan、docs に反映する | 対応 |
| R6 | 実 AWS dev/UAT E2E・性能・RAG品質検証を完了する | 未対応。AWS credentials 不在 |

## 検討・判断

- raw input dry-run の前段で raw output 本体を検査し、JSON/text の取り違えや空ファイルを早期に fail させる方針にした。
- command id ごとの output kind は既存 `preflightCaptureCommandIds` / `validationCaptureCommandIds` を使い、`cloudfront-access-log` だけ text、それ以外は JSON とした。
- fixture では sample/raw output を許可し、通常実行では `sample`、`fixture`、`mock`、`localhost` などの text を含む raw output を reject する。

## 実施作業

- `tools/aws-dev-uat-raw-output-checker.js` を追加し、raw input の `output_ref` 参照先 content check を実装。
- `tools/check-aws-dev-uat-raw-output.js` と `tools/check-aws-dev-uat-raw-output-fixtures.js` を追加。
- `package.json`、`Taskfile.yml`、`.github/workflows/ci.yml`、CI/docs/external action checker を更新。
- `docs/ops/runbooks/aws-dev-uat-validation.md` と `docs/ops/local-verification.md` に raw output content check の手順と制約を追記。

## 成果物

| 成果物 | 内容 |
|---|---|
| `tools/aws-dev-uat-raw-output-checker.js` | raw output content checker の共通実装 |
| `tools/check-aws-dev-uat-raw-output.js` | operator raw input の `output_ref` content を検査する CLI |
| `tools/check-aws-dev-uat-raw-output-fixtures.js` | sample raw output positive path と invalid JSON / empty text / sample text rejection の fixture check |

## 検証

- `npm run aws:dev-uat:raw-output:fixture:check`: pass
- `npm run aws:dev-uat:raw-input:fixture:check`: pass
- `npm run acceptance:external-actions:check`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `task aws:dev-uat:raw-output:fixture:check`: pass
- `git diff --check`: pass
- `npm run verify`: pass
- `aws sts get-caller-identity --output json`: fail。`Unable to locate credentials.` のため実 AWS identity は未確認。

## Fit 評価

総合fit: 4.4 / 5.0（約88%）

理由: 実 AWS raw output を final evidence へ投入する前の content check を追加し、7 の実行失敗を早期に検出しやすくした。実 AWS credentials がないため、dev/UAT の実検証完了証跡はまだ作成できていない。

## 未対応・制約・リスク

- AWS credentials がないため、DSQL/Flyway 実適用、CDK deploy、Docusaurus/Allure 実 publish、AWS dev/UAT E2E・性能・RAG品質検証の実行結果は未取得。
- raw output fixture は sample raw output の形式確認であり、最終検収 evidence ではない。
- content checker は raw output の形式・空ファイル・placeholder text を検査するが、AWS command 自体は実行しない。
