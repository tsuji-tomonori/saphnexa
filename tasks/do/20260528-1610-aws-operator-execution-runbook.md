# AWS operator execution runbook

状態: do

## 背景

AWS dev/UAT の最終 gate は raw capture plan、operator input、materialized evidence、final readiness manifest で未解決入力を検知できるようになった。一方で、実行者が外部状態を変更する deploy / publish / capture / materialize / final gate をどの順序で、どの停止条件で進めるかを 1 つの検査可能な成果物として確認する仕組みがまだ弱い。

## 目的

7. AWS dev/UAT E2E・性能・RAG 品質検証の実行直前に、resolved operator input から外部実行用の手順、停止条件、証跡出力、未解決 placeholder の有無を検査できる operator execution runbook を追加する。

## タスク種別

機能追加

## スコープ

- AWS dev/UAT operator execution runbook artifact を生成する。
- runbook checker / fixture checker を追加し、未解決 placeholder、危険な順序、確認なし外部操作を reject する。
- `package.json`、`Taskfile.yml`、CI workflow、docs、external action plan の同期を行う。
- 実 AWS deploy、migration、CloudFront publish、E2E、load test、Bedrock Evaluations の実行は対象外。

## 計画

1. 既存の operator input、handoff、raw capture plan、final readiness の schema / checker パターンを確認する。
2. operator execution runbook builder / check / fixture check を追加する。
3. npm scripts、Taskfile、CI、docs check、external acceptance action plan を同期する。
4. targeted checks と `npm run verify` を実行する。
5. report、commit、push、PR body/comment、task done 移動まで完了する。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に runbook の用途、未解決時の blocked status、resolved operator input での ready 条件を追記する。
- `docs/ops/local-verification.md` に local gate と実 AWS 未実行制約を追記する。
- `tools/check-docs.js` と CI workflow で docs / automation 同期を検査する。

## 受け入れ条件

- [ ] `npm run aws:dev-uat:operator-runbook:check` が operator execution runbook を生成・検査し、未解決 operator input では external execution ready と扱わない。
- [ ] `npm run aws:dev-uat:operator-runbook:fixture:check` が resolved input の ready path、placeholder 混入、確認なし外部 phase、順序崩れを検査する。
- [ ] `package.json`、`Taskfile.yml`、`.github/workflows/ci.yml`、`tools/check-ci-workflow.js`、`tools/check-docs.js`、`docs/ops/*`、external action plan が runbook と同期している。
- [ ] `npm run verify` が pass する。
- [ ] 実 AWS credentials がない場合、AWS dev/UAT 実行完了とは扱わず docs/report/PR に制約を明記する。

## 検証計画

- `npm run aws:dev-uat:operator-input:check`
- `npm run aws:dev-uat:operator-input:fixture:check`
- `npm run aws:dev-uat:operator-runbook:check`
- `npm run aws:dev-uat:operator-runbook:fixture:check`
- `npm run aws:dev-uat:operator-handoff:check`
- `npm run aws:dev-uat:final-readiness:check`
- `npm run docs:check`
- `npm run ci:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json` は credentials 未設定なら fail/未完了制約として記録する。

## PR レビュー観点

- runbook が外部状態変更を自動実行せず、実行者向けの検査可能 artifact に留まっていること。
- deploy / publish / capture / materialize / final gate の順序と停止条件が明示されていること。
- resolved mode で placeholder、sample、mock、local 値を受け入れていないこと。
- docs と実装が同期していること。
- RAG の根拠性・認可境界、benchmark 期待語句や dataset 固有分岐を弱めていないこと。

## リスク

- 実 AWS credentials がないため、ready path は fixture による構造検査に留まる。
- runbook は手順と gate の明確化であり、AWS dev/UAT の実行証跡そのものの代替ではない。
