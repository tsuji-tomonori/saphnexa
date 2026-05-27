# evidence manifest cdk version required

状態: done

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0` の evidence manifest 例は `cdk_app_version` を含み、完了条件でも検収対象 CDK stack / deploy 対象を証跡マニフェストに記録することを求めている。現行の final evidence candidate validator も `manifest.cdk_app_version` が final text であることを検査している。

一方、`docs/acceptance/evidence/evidence_manifest.schema.json` の `required` には `cdk_app_version` が含まれていない。schema と validator がずれると、最終 manifest 作成時に schema 上は不足を見逃し、validator で後から落ちる状態になる。

## 目的

evidence manifest schema の required fields と final validator を同期し、`cdk_app_version` 欠落を schema/example check の段階で検出できるようにする。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点で final evidence candidate validator は `manifest.cdk_app_version` を最終値として要求するが、evidence manifest schema の required list は `cdk_app_version` を必須としていない。

### 確認済み事実

- `.workspace/Saphnexa_検収受入条件_package_v1.0/Saphnexa_証跡マニフェスト_schema_v1.0.json` は `cdk_app_version` property を定義している。
- `.workspace/Saphnexa_検収受入条件_package_v1.0/Saphnexa_受入条件_完了条件_v1.0.md` の evidence manifest 例は `cdk_app_version` を含む。
- `tools/build-acceptance-package.js` は draft manifest に `cdk_app_version` を出力している。
- `tools/final-evidence-candidate.js` は `isFinalText(manifest.cdk_app_version)` を検査している。
- `docs/acceptance/evidence/evidence_manifest.example.json` は `cdk_app_version` を含む。
- `docs/acceptance/evidence/evidence_manifest.schema.json` の `required` には `cdk_app_version` が含まれていない。
- `tools/check-evidence-manifest.js` の `expectedRequired` と `x_final_acceptance_extension.required` も `cdk_app_version` を要求していない。

### 推定原因

- 元 schema の `required` に合わせて repository schema を取り込んだ後、final validator 側で `cdk_app_version` の最終値検査が追加された。
- final acceptance extension として `github_release_url` は required に追加されたが、`cdk_app_version` を schema required に昇格する同期が漏れた。

### 根本原因

- evidence manifest schema と final validator の required contract を同期検査する観点が不足していた。
- final acceptance extension の required fields が GitHub release URL だけに限定され、CDK app version の最終証跡要件を表現していなかった。

### 影響範囲

- `docs/acceptance/evidence/evidence_manifest.schema.json`
- `tools/check-evidence-manifest.js`
- final evidence manifest 作成手順
- AC-001 / AC-002 / AC-150 / AC-151 / AC-152 の証跡 manifest preflight

### 対策

- evidence manifest schema の `required` に `cdk_app_version` を追加する。
- `x_final_acceptance_extension.required` に `cdk_app_version` を追加し、extension reason を更新する。
- `tools/check-evidence-manifest.js` の expected required list と final acceptance extension list を更新する。
- example manifest が `cdk_app_version` を持つことを check で明示する。

## スコープ

- 対象:
  - `docs/acceptance/evidence/evidence_manifest.schema.json`
  - `tools/check-evidence-manifest.js`
  - task/report
- 対象外:
  - final evidence manifest 実ファイルの作成
  - Git tag / GitHub Release / AWS deploy / signoff
  - final validator logic の再変更

## 実装計画

1. schema required と final acceptance extension required に `cdk_app_version` を追加する。
2. schema extension reason を CDK app version と GitHub release URL の両方を説明する文に更新する。
3. `tools/check-evidence-manifest.js` の expected lists と example assertion を更新する。
4. evidence / final candidate / package / verify checks を実行する。
5. 作業レポート、commit、push、PR コメントまで反映する。

## ドキュメント保守計画

- evidence manifest schema 自体を更新する。
- final acceptance runbook は既に final evidence manifest の `cdk_app_version` 検証を記載済みのため、追加更新が必要か確認する。

## 受け入れ条件

- [x] evidence manifest schema の `required` に `cdk_app_version` が含まれる。
- [x] `x_final_acceptance_extension.required` に `cdk_app_version` が含まれる。
- [x] `tools/check-evidence-manifest.js` が `cdk_app_version` の required contract と example presence を検査する。
- [x] final evidence candidate fixture の `cdk_app_version` 検査を弱めない。
- [x] 外部状態を変更せず、final acceptance pending 状態を維持する。

## Done 条件

- [x] 実装差分が PR branch に commit / push されている。
- [x] 受け入れ条件確認コメントとセルフレビューコメントを PR に投稿している。
- [x] task md に PR コメント URL と検証結果を記録し、`tasks/done/` へ移動している。
- [x] 作業レポートを `reports/working/` に保存している。

## 検証計画

- `npm run evidence:check`
- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:package:check`
- `npm run docs:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- `npm run evidence:check`: pass
- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run verify`: pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553602803
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553605373
- GitHub Apps comment は既知の 403 `Resource not accessible by integration` のため、`gh pr comment` fallback で投稿した。

## PR レビュー観点

- schema required と final validator の `cdk_app_version` 要求が同期しているか。
- source package 由来 schema への extension 理由が明確か。
- 未実施の release/AWS/signoff を完了扱いしていないか。

## リスク

- final manifest 作成者は `cdk_app_version` を実際の deploy 対象 version として記録する必要がある。
