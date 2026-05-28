# Final readiness missing artifact next commands

状態: done

## 背景

AWS dev/UAT final readiness manifest は operator input / operator execution runbook を必須条件として扱う。現在の `missing_operator_input` / `missing_operator_runbook` blocker は resolved file の検査 command を示すが、file が存在しない初回状態では scaffold/build/check の入口が manifest 上の `next_commands` から直接辿りにくい。

## 目的

7. AWS dev/UAT E2E・性能・RAG 品質検証に進む operator が、final readiness manifest の `next_commands` だけで missing artifact から必要な scaffold/build/check 手順へ進めるようにする。

## タスク種別

機能追加

## スコープ

- `missing_operator_input` 時の `next_commands` に operator input scaffold/check command を追加する。
- `missing_operator_runbook` 時の `next_commands` に operator runbook build/check command を追加する。
- final readiness fixture と docs / docs check を同期する。
- 実 AWS deploy、migration、publish、E2E、load test、Bedrock Evaluations の実行は対象外。

## 計画

1. final readiness の missing operator artifact next command を実行順に整理する。
2. fixture の missing path assertion を追加・更新する。
3. docs と docs check を同期する。
4. targeted checks と `npm run verify` を実行し、レポート、commit、PR 更新、task done まで行う。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に missing artifact からの scaffold/build/check 手順を追記する。
- `docs/ops/local-verification.md` に final readiness `next_commands` の期待を追記する。
- `tools/check-docs.js` に docs 同期 phrase を追加する。

## 受け入れ条件

- [ ] `missing_operator_input` の `next_commands` が scaffold/check と resolved check の入口を含む。
- [ ] `missing_operator_runbook` の `next_commands` が runbook build/check と resolved runbook check の入口を含む。
- [ ] `npm run aws:dev-uat:final-readiness:fixture:check` が missing operator artifact の next command を検査する。
- [ ] docs と `tools/check-docs.js` が missing artifact next command と同期している。
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

- `next_commands` が存在しない resolved artifact だけを指さず、operator の初回復旧手順を示すこと。
- 実 AWS 証跡や external execution を local fixture で代替していないこと。
- docs と実装が同期していること。
- RAG の根拠性・認可境界、benchmark 期待語句や dataset 固有分岐を弱めていないこと。

## リスク

- command の追加は operator guidance の改善であり、実 AWS 実行や証跡生成の代替ではない。
- 実 AWS credentials がないため、ready path は fixture による構造検査に留まる。

## 完了メモ

- 実装 commit: `9d7e4ae` (`✨ feat(acceptance): final readinessのmissing artifact復旧手順を追加`)
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/2
- 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4561882849
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4561882874
- 作業レポート: `reports/working/20260528-1651-final-readiness-missing-artifact-next-commands.md`

## 完了時の検証

- `npm run aws:dev-uat:final-readiness:check`: pass
- `npm run aws:dev-uat:final-readiness:fixture:check`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass
- `npm run verify`: pass
- `aws sts get-caller-identity --output json`: fail。理由: `Unable to locate credentials.`
