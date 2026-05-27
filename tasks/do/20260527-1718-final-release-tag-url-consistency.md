# final release tag/url consistency gate

状態: do

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0` の AC-001 は、検収対象の Git commit SHA、tag、GitHub release を証跡 manifest に記録し照合することを求めている。`docs/ops/runbooks/final-acceptance.md` も Git tag と GitHub release URL の一致確認を検証項目にしている。

現状の `tools/final-evidence-candidate.js` は `git_tag` が placeholder でないこと、`github_release_url` が GitHub URL であることは検査しているが、URL が同じ tag を指すことまでは検査していない。

## 目的

final evidence candidate の検査で、`github_release_url` が `git_tag` と一致しない場合を検出し、誤った release 証跡で AC-001 を満たした扱いにしない。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の final evidence candidate validator で、`git_tag` と異なる GitHub release tag URL が入力された場合でも、URL 形式が正しければ manifest 検査を通過し得る。

### 確認済み事実

- `docs/ops/runbooks/final-acceptance.md` は「Git tag と GitHub release URL が一致すること」を検証項目にしている。
- `tools/final-evidence-candidate.js` の `validateManifest` は `isFinalText(manifest.git_tag)` と `isUrl(manifest.github_release_url)` を個別に検査している。
- `isUrl` は `https://github.com/` 始まりかどうかと placeholder 語句を確認するだけで、`/releases/tag/<git_tag>` の一致を検査していない。
- `tools/check-final-evidence-candidate-fixtures.js` の invalid fixture は pending tag、commit mismatch、checklist result、CloudFormation source の不正を検査するが、release URL/tag mismatch を検査していない。

### 推定原因

- schema / runbook / validator を段階的に追加した過程で、release URL の形式検査と tag 値の相関検査が別観点として扱われ、相関を fixture に落とし込む回帰テストが不足した。

### 根本原因

- AC-001 の「Git tag と GitHub release の照合」を、validator の機械検査項目として明示する標準が不足していた。
- fixture が「単項目の不正値」中心で、複数フィールド間整合性の不正をカバーしていなかった。

### 影響範囲

- final evidence candidate の manifest 検査。
- AC-001 / AC-150 / AC-151 / AC-152 の最終判定前 preflight。
- schema / runbook の説明と validator 実装の同期。

### 対策

- `github_release_url` が `/releases/tag/<git_tag>` を指すことを validator で検査する。
- invalid fixture に tag/url mismatch を追加し、同種の欠落を回帰検出する。
- evidence manifest schema と final acceptance runbook に、GitHub release URL が `git_tag` と同じ tag URL であることを明記する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - `docs/acceptance/evidence/evidence_manifest.schema.json`
  - `docs/ops/runbooks/final-acceptance.md`
- 対象外:
  - Git tag / GitHub release の作成
  - AWS deploy / publish
  - final checklist signoff

## 実装計画

1. `validateManifest` に release URL/tag consistency check を追加する。
2. URL tag segment の percent-encoding を考慮した helper を追加する。
3. fixture check に mismatch ケースを追加する。
4. schema / runbook の説明を validator と同期する。
5. 関連検証を実行し、必要なら修正して再実行する。

## ドキュメント保守計画

- final evidence manifest schema の `github_release_url` 説明を更新する。
- final acceptance runbook の検証項目を、validator が検査する内容として具体化する。

## 受け入れ条件

- [x] `github_release_url` が `git_tag` と異なる release tag URL を指す場合、final evidence candidate validator が invalid として検出する。
- [x] valid fixture の `git_tag` / `github_release_url` は引き続き ready と判定される。
- [x] evidence manifest schema と runbook が、GitHub release URL と Git tag の一致要件を明記している。
- [x] 外部状態を変更せず、release / AWS / final signoff の pending 状態を維持する。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run docs:check`
- `npm run evidence:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run evidence:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files docs/acceptance/evidence/evidence_manifest.schema.json docs/ops/runbooks/final-acceptance.md tools/check-evidence-manifest.js tools/check-final-evidence-candidate-fixtures.js tools/final-evidence-candidate.js tasks/do/20260527-1718-final-release-tag-url-consistency.md`: pass

## PR レビュー観点

- release URL/tag mismatch を確実に検出しているか。
- placeholder / pending を final evidence として扱わない既存ガードを弱めていないか。
- docs と validator の要件が矛盾していないか。
- 外部状態変更が含まれていないか。

## リスク

- Git tag に URL encode が必要な文字を含む場合、単純比較では誤判定する可能性があるため `encodeURIComponent` を使う。
- GitHub release URL の repository owner/name は現時点で `https://github.com/` 配下のみを許容しており、既存の repository 固定までは行わない。
