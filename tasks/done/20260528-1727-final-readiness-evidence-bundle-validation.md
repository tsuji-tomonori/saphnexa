# final readiness evidence bundle validation

状態: done
タスク種別: 修正

## 背景

AWS dev/UAT の final readiness は、raw input、final evidence、operator input、operator execution runbook を検査する一方で、evidence bundle manifest は存在と hash の確認に留まっている。bundle manifest は最終検収 package の証跡を束ねる gate なので、schema、evidence class、current git、artifact coverage を final readiness 側でも検査する必要がある。

## 目的

`npm run aws:dev-uat:final-readiness:check -- --probe-aws-identity --require-ready` が、存在するだけの不正・古い・不足した evidence bundle manifest を ready 扱いしないようにする。

## 軽量なぜなぜ分析

- 問題文: final readiness manifest が `dist/acceptance/aws_dev_uat_evidence_bundle_manifest.json` の存在だけを ready 判定へ使い、manifest 内容の正当性を検査していない。
- 確認済み事実:
  - `tools/aws-dev-uat-final-readiness.js` は `fileState("evidence-bundle", evidenceBundleManifestPath, true)` で bundle manifest を扱っている。
  - `tools/aws-dev-uat-evidence-bundle.js` が生成する manifest には `schema_version`、`status`、`evidence_class`、`git_commit_sha`、`artifacts`、`artifact_count` がある。
  - final readiness fixture は missing bundle と ready bundle は確認しているが、不正 schema や stale git の bundle manifest は検査していない。
- 推定原因:
  - bundle manifest 作成時の checker 側に検証責務が寄っており、final readiness 側の再検査条件が不足した。
  - ready 判定に使う artifact と、単に参照する artifact の区別が `fileState` で表現できていなかった。
- 根本原因:
  - final readiness の artifact state に、bundle manifest 専用の schema/鮮度/coverage 検査モデルがない。
- 対策:
  - bundle manifest 専用 state を追加し、schema、status、evidence_class、current git、必須 artifact coverage、artifact_count 整合性を検査する。
  - invalid/stale bundle の negative fixture を追加し、docs と docs check に期待挙動を反映する。

## 作業範囲

- `tools/aws-dev-uat-final-readiness.js`
  - evidence bundle manifest の内容検証を追加する。
  - invalid/stale/incomplete bundle を blocker と next command に反映する。
- `tools/check-aws-dev-uat-final-readiness.js`
  - final readiness manifest の bundle state schema を検証する。
- `tools/check-aws-dev-uat-final-readiness-fixtures.js`
  - invalid bundle と stale bundle の negative path を追加する。
- `docs/ops/runbooks/aws-dev-uat-validation.md`
  - final readiness が bundle manifest の内容も検査することを追記する。
- `docs/ops/local-verification.md`
  - fixture が invalid/stale bundle path を検査することを追記する。
- `tools/check-docs.js`
  - durable docs の同期語句を追加する。
- `reports/working/`
  - 作業完了レポートを残す。

## ドキュメントメンテナンス方針

運用者が final readiness の blocker と next command を見て復旧できることが重要なため、runbook と local verification の該当箇所だけを更新する。API、UI、README、AGENTS.md への影響はない見込み。

## 受け入れ条件

- [x] final readiness が `schema_version !== saphnexa-aws-dev-uat-evidence-bundle.v1`、`status !== checked`、`evidence_class !== aws-captured`、artifact coverage 不足、`artifact_count` 不整合を `invalid_evidence_bundle_manifest` として ready 扱いしない。
- [x] final readiness が bundle manifest の `git_commit_sha` 不一致を `stale_evidence_bundle_manifest` として ready 扱いしない。
- [x] ready final readiness は current git の `aws-captured` bundle manifest と、preflight/validation raw input、preflight/validation final evidence、execution bridge の artifact coverage を要求する。
- [x] fixture check が missing/invalid/stale/ready bundle manifest path を検査する。
- [x] docs と docs check が final readiness の bundle manifest 内容検証と同期している。
- [x] 実行した検証と未実施の AWS 実検証を、PR コメントと作業レポートに正直に記載する。

## 完了メモ

- 実装 commit: `87adca2`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/2
- 受け入れ条件コメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4562193637
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4562193629
- 作業レポート: `reports/working/20260528-1732-final-readiness-evidence-bundle-validation.md`
- 検証: `npm run aws:dev-uat:final-readiness:check` pass、`npm run aws:dev-uat:final-readiness:fixture:check` pass、`npm run docs:check` pass、`git diff --check` pass、`npm run verify` pass。
- 制約: `aws sts get-caller-identity --output json` は AWS credentials 不在で fail。実 AWS dev/UAT E2E・性能・RAG品質検証は未実施。

## 検証計画

- `npm run aws:dev-uat:final-readiness:check`
- `npm run aws:dev-uat:final-readiness:fixture:check`
- `npm run docs:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json` は AWS credentials の有無を確認し、失敗した場合は制約として記録する。

## PR セルフレビュー観点

- docs と実装の同期。
- final readiness が存在だけの bundle manifest を ready にしないこと。
- fixture が negative path を狭く再現していること。
- RAG 根拠性・認可境界を弱める変更がないこと。
- benchmark 期待語句、QA sample 固有値、dataset 固有分岐を実装へ入れていないこと。

## リスク

- 実 AWS dev/UAT 実行は認証情報がない環境では実施できない。
- bundle artifact coverage は manifest の構造を検査するもので、実 artifact の再読込や再 hash は evidence bundle checker の責務として維持する。
