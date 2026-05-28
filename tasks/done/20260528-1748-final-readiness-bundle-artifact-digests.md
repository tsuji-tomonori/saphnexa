# final readiness bundle artifact digests

状態: done
タスク種別: 修正

## 背景

final readiness は evidence bundle manifest の schema、status、evidence class、current git commit、artifact count、artifact coverage、current readiness artifact path match を検査するようになった。一方で、bundle manifest の artifact に記録された `sha256` / `size_bytes` が現在の artifact ファイルと一致するかまでは final readiness 側で再検査していない。

## 目的

実 AWS dev/UAT 証跡の改ざん・取り違えを防ぐため、final readiness が evidence bundle manifest の required artifact digest / size を現在ファイルから再計算して照合する。

## 軽量なぜなぜ分析

- 問題文: final readiness が evidence bundle manifest の required artifact path までは照合するが、manifest に記録された `sha256` / `size_bytes` と現在ファイルの実値の一致を検査していない。
- 確認済み事実:
  - `tools/aws-dev-uat-evidence-bundle.js` の artifact には `size_bytes` と `sha256` が含まれる。
  - `tools/aws-dev-uat-final-readiness.js` の `evidenceBundleState` は `path_matches` を計算するが、matched artifact の digest / size は再計算していない。
  - `tools/check-aws-dev-uat-final-readiness-fixtures.js` は path mismatch の negative path を持つが、digest mismatch の negative path はない。
- 推定原因:
  - path 取り違え防止を先に導入し、内容同一性の再検査は evidence bundle checker 側に寄せたままだった。
  - final readiness の required artifact state に `sha256_matches` / `size_bytes_matches` がない。
- 根本原因:
  - final readiness の bundle artifact state が、bundle manifest の artifact metadata と現在ファイルの実値を比較するモデルを持っていない。
- 対策:
  - path match した required artifact について、現在ファイルの `sha256` と `size_bytes` を再計算して manifest 値と照合する。
  - digest mismatch の negative fixture を追加し、docs と docs check に期待挙動を反映する。

## 作業範囲

- `tools/aws-dev-uat-final-readiness.js`
  - required artifact state に `sha256_matches`、`size_bytes_matches`、`metadata_matches` を追加する。
  - digest / size mismatch を `invalid_evidence_bundle_manifest` にする。
- `tools/check-aws-dev-uat-final-readiness.js`
  - ready manifest で required artifact metadata match を検査する。
- `tools/check-aws-dev-uat-final-readiness-fixtures.js`
  - bundle artifact digest mismatch の negative path を追加する。
- `docs/ops/runbooks/aws-dev-uat-validation.md` / `docs/ops/local-verification.md`
  - artifact coverage が current readiness path と digest / size 照合を含むことを追記する。
- `tools/check-docs.js`
  - docs 同期語句を追加する。
- `reports/working/`
  - 作業完了レポートを残す。

## ドキュメントメンテナンス方針

運用者が invalid bundle の再生成理由を読み取れるよう、runbook と local verification の該当箇所だけを更新する。API、UI、README、AGENTS.md への影響はない見込み。

## 受け入れ条件

- [x] final readiness が path match した required artifact の `sha256` と `size_bytes` を現在ファイルから再計算して照合する。
- [x] bundle artifact の path は一致していても `sha256` または `size_bytes` が異なる場合、`invalid_evidence_bundle_manifest` として ready 扱いしない。
- [x] ready final readiness の `evidence_bundle_manifest.required_artifacts` が `metadata_matches: true` を持つ。
- [x] fixture check が digest mismatch bundle manifest path を検査する。
- [x] docs と docs check が digest / size 照合を含む artifact coverage と同期している。
- [x] 実行した検証と未実施の AWS 実検証を、PR コメントと作業レポートに正直に記載する。

## 完了メモ

- 実装 commit: `063cbc9`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/2
- 受け入れ条件コメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4562320742
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4562320743
- 作業レポート: `reports/working/20260528-1752-final-readiness-bundle-artifact-digests.md`
- 検証: `npm run aws:dev-uat:final-readiness:check` pass、`npm run aws:dev-uat:final-readiness:fixture:check` pass、`npm run docs:check` pass、`git diff --check` pass、`npm run verify` pass。
- 制約: `aws sts get-caller-identity --output json` は AWS credentials 不在で fail。実 AWS dev/UAT E2E・性能・RAG品質検証は未実施。
- GitHub Apps: PR 本文更新は 403 `Resource not accessible by integration` のため `gh` fallback を使用。

## 検証計画

- `npm run aws:dev-uat:final-readiness:check`
- `npm run aws:dev-uat:final-readiness:fixture:check`
- `npm run docs:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json` は AWS credentials の有無を確認し、失敗した場合は制約として記録する。

## PR セルフレビュー観点

- docs と実装の同期。
- digest / size mismatch が ready にならないこと。
- fixture が digest mismatch を狭く再現していること。
- RAG 根拠性・認可境界を弱める変更がないこと。
- benchmark 期待語句、QA sample 固有値、dataset 固有分岐を実装へ入れていないこと。

## リスク

- 実 AWS dev/UAT 実行は認証情報がない環境では実施できない。
- final readiness は read-only に artifact file を再読込するため、artifact が巨大化した場合のローカル実行時間は artifact size に依存する。
