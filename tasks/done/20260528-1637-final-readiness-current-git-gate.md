# Final readiness current git gate

状態: done

## 背景

AWS dev/UAT final readiness は resolved operator input と ready operator execution runbook を必須にした。一方で、これらの artifact が現在の検収対象 commit から生成されたものかを final readiness の blocker として扱う検査はまだ弱い。古い commit の operator input / runbook を流用できると、実 AWS 証跡と source revision の対応が曖昧になる。

## 目的

7. AWS dev/UAT E2E・性能・RAG 品質検証の final acceptance package ready 判定に、operator input と operator execution runbook の current git commit 一致を必須条件として追加する。

## タスク種別

機能追加

## スコープ

- final readiness manifest の operator input / operator execution runbook state に current git commit 判定を追加する。
- stale operator input / stale operator runbook を blocker にする。
- final readiness fixture と docs / docs check を更新する。
- 実 AWS deploy、migration、publish、E2E、load test、Bedrock Evaluations の実行は対象外。

## 計画

1. final readiness の operator input / runbook state に current git commit 判定を追加する。
2. stale 判定時の blockers / next commands を追加する。
3. fixture に stale operator input / stale runbook negative path を追加する。
4. docs と docs check を同期する。
5. targeted checks と broad verify を実行し、レポート、commit、PR 更新、task done まで行う。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に current git commit gate を追記する。
- `docs/ops/local-verification.md` に stale artifact を ready 扱いしないことを追記する。
- `tools/check-docs.js` に docs 同期 phrase を追加する。

## 受け入れ条件

- [ ] final readiness manifest が operator input と operator execution runbook の current git commit 判定を含む。
- [ ] `npm run aws:dev-uat:final-readiness:fixture:check` が stale operator input / stale operator runbook を ready 扱いにしない。
- [ ] docs と `tools/check-docs.js` が current git gate と同期している。
- [ ] `npm run verify` が pass する。
- [ ] 実 AWS credentials がないため実 AWS dev/UAT 実行完了とは扱わないことを docs/report/PR に明記する。

## 検証計画

- `npm run aws:dev-uat:final-readiness:check`
- `npm run aws:dev-uat:final-readiness:fixture:check`
- `npm run aws:dev-uat:operator-runbook:check`
- `npm run docs:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json` は credentials 未設定なら fail/未完了制約として記録する。

## PR レビュー観点

- stale operator input / runbook が final readiness ready にならないこと。
- 実 AWS 証跡、operator input、operator runbook、source commit の対応を曖昧にしていないこと。
- docs と実装が同期していること。
- RAG の根拠性・認可境界、benchmark 期待語句や dataset 固有分岐を弱めていないこと。

## リスク

- 実 AWS credentials がないため、ready path は fixture による構造検査に留まる。
- current git gate は実 AWS 証跡や外部承認の代替ではなく、証跡と検収対象 commit の対応を強める追加条件である。

## 完了メモ

- 実装 commit: `a1c3171` (`✨ feat(acceptance): final readinessにcurrent git gateを追加`)
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/2
- 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4561827941
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4561827920
- 作業レポート: `reports/working/20260528-1640-final-readiness-current-git-gate.md`

## 完了時の検証

- `npm run aws:dev-uat:final-readiness:check`: pass
- `npm run aws:dev-uat:final-readiness:fixture:check`: pass
- `npm run aws:dev-uat:operator-runbook:check`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass
- `npm run verify`: pass
- `aws sts get-caller-identity --output json`: fail。理由: `Unable to locate credentials.`
