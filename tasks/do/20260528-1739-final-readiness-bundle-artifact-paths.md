# final readiness bundle artifact paths

状態: do
タスク種別: 修正

## 背景

final readiness は evidence bundle manifest の `schema_version`、`status`、`evidence_class`、current git commit、artifact count、artifact coverage を検査するようになった。一方で artifact coverage は `kind` / `mode` の存在確認に留まり、final readiness が現在参照している preflight / validation raw input、final evidence、execution bridge の path と bundle 内 artifact path の一致までは検査していない。

## 目的

実 AWS dev/UAT 証跡の取り違えを防ぐため、final readiness が evidence bundle manifest の required artifacts を現在の raw input / final evidence / execution bridge path に紐付けて検査する。

## 軽量なぜなぜ分析

- 問題文: final readiness が bundle manifest の required artifact coverage を `kind` / `mode` だけで判定し、実際に対象 path が一致することを検査していない。
- 確認済み事実:
  - `tools/aws-dev-uat-final-readiness.js` の `requiredEvidenceBundleArtifacts` は `kind` / `mode` のみを持つ。
  - `evidenceBundleState` は `artifacts.some((artifact) => artifact.kind === required.kind && artifact.mode === required.mode)` で `present` を計算している。
  - `tools/aws-dev-uat-evidence-bundle.js` の artifact には `path` が含まれる。
- 推定原因:
  - 初回の bundle manifest 内容検証では schema/鮮度/coverage の最低限を優先し、path 照合を別軸として残した。
  - required artifact の期待値モデルに `expected_path` がなかった。
- 根本原因:
  - final readiness の bundle artifact state が、現在の readiness 入力 path と bundle artifact path の対応関係を表現していない。
- 対策:
  - required artifact ごとに `expected_path` を持たせ、bundle artifact の `path` を正規化して照合する。
  - path mismatch の negative fixture を追加し、docs と docs check に期待挙動を反映する。

## 作業範囲

- `tools/aws-dev-uat-final-readiness.js`
  - `evidenceBundleState` に expected artifact paths を渡し、path match まで required artifact coverage に含める。
  - path mismatch を `invalid_evidence_bundle_manifest` にする。
- `tools/check-aws-dev-uat-final-readiness.js`
  - required artifact state に `expected_path` と `path_matches` があることを検査する。
- `tools/check-aws-dev-uat-final-readiness-fixtures.js`
  - bundle artifact path mismatch の negative path を追加する。
- `docs/ops/runbooks/aws-dev-uat-validation.md` / `docs/ops/local-verification.md`
  - artifact coverage が current readiness path との照合を含むことを追記する。
- `tools/check-docs.js`
  - docs 同期語句を追加する。
- `reports/working/`
  - 作業完了レポートを残す。

## ドキュメントメンテナンス方針

運用者が stale/invalid bundle を再生成すべき理由を読み取れるよう、runbook と local verification のみを更新する。API、UI、README、AGENTS.md への影響はない見込み。

## 受け入れ条件

- [ ] final readiness が bundle manifest の required artifacts を現在の preflight raw input、validation raw input、preflight final evidence、validation final evidence、execution bridge path と照合する。
- [ ] bundle artifact の `kind` / `mode` は揃っていても path が異なる場合、`invalid_evidence_bundle_manifest` として ready 扱いしない。
- [ ] ready final readiness の `evidence_bundle_manifest.required_artifacts` が `expected_path` と `path_matches: true` を持つ。
- [ ] fixture check が path mismatch bundle manifest path を検査する。
- [ ] docs と docs check が path 照合を含む artifact coverage と同期している。
- [ ] 実行した検証と未実施の AWS 実検証を、PR コメントと作業レポートに正直に記載する。

## 検証計画

- `npm run aws:dev-uat:final-readiness:check`
- `npm run aws:dev-uat:final-readiness:fixture:check`
- `npm run docs:check`
- `git diff --check`
- `npm run verify`
- `aws sts get-caller-identity --output json` は AWS credentials の有無を確認し、失敗した場合は制約として記録する。

## PR セルフレビュー観点

- docs と実装の同期。
- path mismatch が ready にならないこと。
- fixture が path mismatch を狭く再現していること。
- RAG 根拠性・認可境界を弱める変更がないこと。
- benchmark 期待語句、QA sample 固有値、dataset 固有分岐を実装へ入れていないこと。

## リスク

- 実 AWS dev/UAT 実行は認証情報がない環境では実施できない。
- path 照合は bundle manifest に記録された artifact path と final readiness の入力 path の一致確認であり、artifact の再 hash は evidence bundle checker 側の責務として維持する。
