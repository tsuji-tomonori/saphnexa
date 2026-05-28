# Final readiness operator runbook gate

状態: done

## 背景

AWS dev/UAT operator execution runbook は、resolved operator input 後の外部実行順序、確認 gate、停止条件、証跡出力を検査できる。一方で final readiness manifest は operator input を必須条件にしているが、operator execution runbook が存在し ready であることをまだ ready 判定に組み込んでいない。このままだと、実 AWS 証跡が揃った場合でも、外部実行順序 gate を通したことを final readiness が直接要求できない。

## 目的

7. AWS dev/UAT E2E・性能・RAG 品質検証の final acceptance package ready 判定に、ready operator execution runbook の存在と検査結果を必須条件として追加する。

## タスク種別

機能追加

## スコープ

- `aws_dev_uat_final_readiness.json` に operator execution runbook state を追加する。
- final readiness ready 判定で missing / invalid operator runbook を blocker にする。
- final readiness fixture / docs / docs check を更新する。
- 実 AWS deploy、migration、publish、E2E、load test、Bedrock Evaluations の実行は対象外。

## 計画

1. final readiness builder に operator execution runbook path と validator を結合する。
2. final readiness checker で runbook state と blocker / next command を検査する。
3. final readiness fixture の ready path に resolved operator input から ready runbook を用意し、missing / invalid path が blocked になることを確認する。
4. runbook / local verification / docs check を更新する。
5. targeted checks と broad verify を実行し、レポート、commit、PR 更新、task done まで行う。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に final readiness が ready operator execution runbook を必須にすることを明記する。
- `docs/ops/local-verification.md` に local gate と未完了扱いの制約を追記する。
- `tools/check-docs.js` に docs 同期 phrase を追加する。

## 受け入れ条件

- [ ] `npm run aws:dev-uat:final-readiness:check` が operator execution runbook state を manifest に含め、ready runbook がない場合に blocker / next command を出す。
- [ ] `npm run aws:dev-uat:final-readiness:fixture:check` が ready fixture では ready operator execution runbook を要求し、missing / invalid runbook を ready 扱いにしない。
- [ ] docs と `tools/check-docs.js` が final readiness operator runbook gate と同期している。
- [ ] `npm run verify` が pass する。
- [ ] 実 AWS credentials がないため実 AWS dev/UAT 実行完了とは扱わないことを docs/report/PR に明記する。

## 検証計画

- `npm run aws:dev-uat:operator-runbook:check`
- `npm run aws:dev-uat:operator-runbook:fixture:check`
- `npm run aws:dev-uat:final-readiness:check`
- `npm run aws:dev-uat:final-readiness:fixture:check`
- `npm run aws:dev-uat:operator-handoff:check`
- `npm run docs:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json` は credentials 未設定なら fail/未完了制約として記録する。

## PR レビュー観点

- final readiness が ready operator execution runbook なしに ready にならないこと。
- operator runbook checker の placeholder / confirmation / order rejection を弱めていないこと。
- docs と実装が同期していること。
- RAG の根拠性・認可境界、benchmark 期待語句や dataset 固有分岐を弱めていないこと。

## リスク

- 実 AWS credentials がないため、ready path は fixture による構造検査に留まる。
- operator execution runbook は final readiness の必要条件であり、実 AWS 証跡や外部承認の代替ではない。

## 完了メモ

- 実装 commit: `38a329b`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/2
- 受け入れ条件コメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4561755209
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4561755194
- 作業レポート: `reports/working/20260528-1631-final-readiness-operator-runbook-gate.md`
