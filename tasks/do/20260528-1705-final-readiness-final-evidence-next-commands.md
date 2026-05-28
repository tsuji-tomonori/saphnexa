# Final readiness final evidence next commands

状態: do

## 背景

AWS dev/UAT final readiness manifest は raw input がない場合に capture plan / scaffold / materialize / raw output-input check を `next_commands` に出す。一方で、raw input materialize 後に必要な preflight / validation final evidence build と final gate command が同じ missing raw input branch からは直接辿れない。evidence bundle check は final evidence を必要とするため、operator が bundle 前の生成順序を manifest だけで追いにくい。

## 目的

7. AWS dev/UAT E2E・性能・RAG 品質検証に進む operator が、final readiness manifest の `next_commands` だけで raw input 作成後の final evidence build / final gate / evidence bundle まで順序を辿れるようにする。

## タスク種別

機能追加

## スコープ

- `missing_preflight_raw_input` / `missing_validation_raw_input` 時の `next_commands` に stage の build command と final command を追加する。
- final readiness fixture と docs / docs check を同期する。
- 実 AWS deploy、migration、publish、E2E、load test、Bedrock Evaluations の実行は対象外。

## 計画

1. final readiness の missing raw input next command に build/final gate を追加する。
2. fixture の missing raw input next command assertion を追加・更新する。
3. docs と docs check を同期する。
4. targeted checks と `npm run verify` を実行し、レポート、commit、PR 更新、task done まで行う。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に missing raw input から final evidence build / final gate までの復旧手順を追記する。
- `docs/ops/local-verification.md` に final readiness `next_commands` の期待を追記する。
- `tools/check-docs.js` に docs 同期 phrase を追加する。

## 受け入れ条件

- [ ] `missing_preflight_raw_input` の `next_commands` が preflight materialize / raw output check / raw input check / build / final gate を含む。
- [ ] `missing_validation_raw_input` の `next_commands` が validation materialize / raw output check / raw input check / build / final gate を含む。
- [ ] `npm run aws:dev-uat:final-readiness:fixture:check` が missing raw input の build/final next command を検査する。
- [ ] docs と `tools/check-docs.js` が final evidence next command と同期している。
- [ ] `npm run verify` が pass する。
- [ ] 実 AWS credentials がないため実 AWS dev/UAT 実行完了とは扱わないことを docs/report/PR に明記する。

## 検証計画

- `npm run aws:dev-uat:final-readiness:check`
- `npm run aws:dev-uat:final-readiness:fixture:check`
- `npm run docs:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json` は credentials 未設定なら fail/未完了制約として記録する。

## PR レビュー観点

- `next_commands` が raw input check で止まらず、final evidence build / final gate / bundle まで operator が辿れること。
- 実 AWS 証跡や external execution を local fixture で代替していないこと。
- docs と実装が同期していること。
- RAG の根拠性・認可境界、benchmark 期待語句や dataset 固有分岐を弱めていないこと。

## リスク

- command の追加は operator guidance の改善であり、実 AWS 実行や証跡生成の代替ではない。
- 実 AWS credentials がないため、ready path は fixture による構造検査に留まる。
