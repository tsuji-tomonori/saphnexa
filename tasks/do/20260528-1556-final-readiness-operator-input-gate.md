# Final readiness operator input gate

状態: doing

## 背景

AWS dev/UAT final readiness manifest は raw capture plan、execution bridge、raw input、final evidence、evidence bundle manifest を集約している。一方で、直前に追加した resolved operator input は final readiness の ready 判定にまだ組み込まれていない。このままだと、実証跡が揃った場合に release/AWS/run/report 入力の未確定を final readiness が直接 blocker として扱えない。

## 目的

7. AWS dev/UAT E2E・性能・RAG 品質検証の final acceptance package ready 判定に、resolved operator input の存在と検査結果を必須条件として追加する。

## タスク種別

機能追加

## スコープ

- `aws_dev_uat_final_readiness.json` に operator input state を追加する。
- final readiness ready 判定で missing / invalid resolved operator input を blocker にする。
- fixture / docs / docs check を更新する。
- 実 AWS deploy、migration、publish、E2E、load test、Bedrock Evaluations の実行は対象外。

## 計画

1. final readiness builder に operator input path と validator を結合する。
2. final readiness checker で operator input state と blocker / next command を検査する。
3. final readiness fixture の ready path に resolved operator input を用意し、missing path が blocked になることを確認する。
4. runbook / local verification / docs check を更新する。
5. targeted checks と broad verify を実行し、レポート、commit、PR 更新、task done まで行う。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に final readiness が resolved operator input を必須にすることを明記する。
- `docs/ops/local-verification.md` に local gate と未完了扱いの制約を追記する。
- `tools/check-docs.js` に docs 同期 phrase を追加する。

## 受け入れ条件

- [ ] `npm run aws:dev-uat:final-readiness:check` が operator input state を manifest に含め、resolved operator input がない場合に blocker / next command を出す。
- [ ] `npm run aws:dev-uat:final-readiness:fixture:check` が ready fixture では resolved operator input を要求し、missing / invalid operator input を ready 扱いにしない。
- [ ] docs と `tools/check-docs.js` が final readiness operator input gate と同期している。
- [ ] `npm run verify` が pass する。
- [ ] 実 AWS credentials がないため実 AWS dev/UAT 実行完了とは扱わないことを docs/report/PR に明記する。

## 検証計画

- `npm run aws:dev-uat:operator-input:check`
- `npm run aws:dev-uat:operator-input:fixture:check`
- `npm run aws:dev-uat:final-readiness:check`
- `npm run aws:dev-uat:final-readiness:fixture:check`
- `npm run aws:dev-uat:operator-handoff:check`
- `npm run docs:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json` は credentials 未設定なら fail/未完了制約として記録する。

## PR レビュー観点

- final readiness が resolved operator input なしに ready にならないこと。
- operator input checker の placeholder rejection を弱めていないこと。
- docs と実装が同期していること。
- RAG の根拠性・認可境界、benchmark 期待語句や dataset 固有分岐を弱めていないこと。

## リスク

- 実 AWS credentials がないため、ready path は fixture による構造検査に留まる。
- resolved operator input は final readiness の必要条件であり、実 AWS 証跡や外部承認の代替ではない。
