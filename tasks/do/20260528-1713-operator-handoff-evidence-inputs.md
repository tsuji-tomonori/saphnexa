# Operator handoff evidence inputs

状態: do

## 背景

AWS dev/UAT operator handoff は release、AWS identity、operator input などを `required_inputs` に持つ。一方で、raw input、final evidence、evidence bundle の必要 path と check command は `next_commands` や `evidence_outputs` に分散しており、handoff artifact だけを読む operator が final readiness に必要な証跡入力を構造的に確認しにくい。

## 目的

7. AWS dev/UAT E2E・性能・RAG 品質検証に進む operator が、handoff artifact の `required_inputs` だけで raw input、final evidence、evidence bundle の必要ファイルと検査 command を把握できるようにする。

## タスク種別

機能追加

## スコープ

- operator handoff の `required_inputs` に preflight / validation raw input、final evidence、evidence bundle manifest の path と check/build command を追加する。
- handoff validator / fixture と docs / docs check を同期する。
- 実 AWS deploy、migration、publish、E2E、load test、Bedrock Evaluations の実行は対象外。

## 計画

1. `tools/aws-dev-uat-operator-handoff.js` の `required_inputs` に evidence input map を追加する。
2. `tools/check-aws-dev-uat-operator-handoff.js` と fixture で path/command を検査する。
3. docs と docs check を同期する。
4. targeted checks と `npm run verify` を実行し、レポート、commit、PR 更新、task done まで行う。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に handoff の evidence input map を追記する。
- `docs/ops/local-verification.md` に handoff 検査期待を追記する。
- `tools/check-docs.js` に docs 同期 phrase を追加する。

## 受け入れ条件

- [ ] operator handoff の `required_inputs` が preflight / validation raw input path と raw output/input check command を含む。
- [ ] operator handoff の `required_inputs` が preflight / validation final evidence path と build/final command を含む。
- [ ] operator handoff の `required_inputs` が evidence bundle manifest path と bundle check command を含む。
- [ ] `npm run aws:dev-uat:operator-handoff:fixture:check` が evidence input map を検査する。
- [ ] docs と `tools/check-docs.js` が handoff evidence input map と同期している。
- [ ] `npm run verify` が pass する。
- [ ] 実 AWS credentials がないため実 AWS dev/UAT 実行完了とは扱わないことを docs/report/PR に明記する。

## 検証計画

- `npm run aws:dev-uat:operator-handoff:check`
- `npm run aws:dev-uat:operator-handoff:fixture:check`
- `npm run docs:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json` は credentials 未設定なら fail/未完了制約として記録する。

## PR レビュー観点

- handoff artifact だけで raw input、final evidence、evidence bundle の path と検査 command を辿れること。
- 実 AWS 証跡や external execution を local fixture で代替していないこと。
- docs と実装が同期していること。
- RAG の根拠性・認可境界、benchmark 期待語句や dataset 固有分岐を弱めていないこと。

## リスク

- required input map の追加は operator guidance の改善であり、実 AWS 実行や証跡生成の代替ではない。
- 実 AWS credentials がないため、ready path は fixture による構造検査に留まる。
