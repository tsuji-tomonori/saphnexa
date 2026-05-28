# final readiness all bundle artifacts

状態: do
タスク種別: 修正

## 背景

final readiness は evidence bundle manifest の required artifact について path、`sha256`、`size_bytes` を current readiness の入力ファイルと照合するようになった。一方で、evidence bundle manifest には raw-output artifact も含まれるが、required artifact 以外の artifact metadata は final readiness の ready 条件に入っていない。

## 目的

実 AWS dev/UAT 証跡 bundle 全体の整合性を高めるため、final readiness が evidence bundle manifest 内の全 artifact path / digest / size を現在ファイルと照合する。

## 軽量なぜなぜ分析

- 問題文: final readiness が required artifact の digest / size は検査するが、bundle manifest に含まれる raw-output など非 required artifact の metadata mismatch を ready 判定で検出していない。
- 確認済み事実:
  - `tools/aws-dev-uat-evidence-bundle.js` は raw input、final evidence、raw output、execution bridge を `artifacts` に含める。
  - `tools/aws-dev-uat-final-readiness.js` の `evidenceBundleState` は required artifact state を作るが、全 artifact の metadata state は持っていない。
  - final readiness fixture は required artifact digest mismatch を検査するが、raw-output artifact mismatch の negative path はない。
- 推定原因:
  - final readiness の再検査が final gate に必要な required artifact から段階的に強化され、bundle 全 artifact の metadata 再検査が未実装だった。
- 根本原因:
  - bundle manifest 全体の artifact metadata と現在ファイルの実値を比較する state がない。
- 対策:
  - `all_artifacts` と `all_artifacts_metadata_matches` を final readiness manifest に追加する。
  - required artifact 以外の digest / size mismatch も `invalid_evidence_bundle_manifest` として ready を止める。
  - raw-output digest mismatch の negative fixture を追加し、docs と docs check に期待挙動を反映する。

## 作業範囲

- `tools/aws-dev-uat-final-readiness.js`
  - bundle manifest の全 artifact について path exists、`sha256`、`size_bytes` を現在ファイルと照合する。
  - 全 artifact metadata mismatch を `invalid_evidence_bundle_manifest` にする。
- `tools/check-aws-dev-uat-final-readiness.js`
  - ready manifest で `all_artifacts_metadata_matches` を検査する。
- `tools/check-aws-dev-uat-final-readiness-fixtures.js`
  - raw-output artifact digest mismatch の negative path を追加する。
- `docs/ops/runbooks/aws-dev-uat-validation.md` / `docs/ops/local-verification.md`
  - 全 bundle artifact metadata 照合を追記する。
- `tools/check-docs.js`
  - docs 同期語句を追加する。
- `reports/working/`
  - 作業完了レポートを残す。

## ドキュメントメンテナンス方針

運用者が evidence bundle manifest の invalid 理由を required artifact 以外にも理解できるよう、runbook と local verification の該当箇所だけを更新する。API、UI、README、AGENTS.md への影響はない見込み。

## 受け入れ条件

- [ ] final readiness が evidence bundle manifest 内の全 artifact の path exists、`sha256`、`size_bytes` を現在ファイルから再計算して照合する。
- [ ] required artifact 以外の raw-output artifact で digest / size mismatch がある場合も、`invalid_evidence_bundle_manifest` として ready 扱いしない。
- [ ] ready final readiness が `all_artifacts_metadata_matches: true` を持つ。
- [ ] fixture check が raw-output digest mismatch bundle manifest path を検査する。
- [ ] docs と docs check が全 bundle artifact metadata 照合と同期している。
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
- raw-output digest mismatch が ready にならないこと。
- fixture が全 artifact metadata mismatch を狭く再現していること。
- RAG 根拠性・認可境界を弱める変更がないこと。
- benchmark 期待語句、QA sample 固有値、dataset 固有分岐を実装へ入れていないこと。

## リスク

- 実 AWS dev/UAT 実行は認証情報がない環境では実施できない。
- final readiness は bundle manifest 内の全 artifact を read-only に再読込するため、artifact 数や size が増えた場合のローカル実行時間は増える。
