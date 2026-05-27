# acceptance package cdk version check

状態: doing

## 背景

直前の task で evidence manifest schema の `required` に `cdk_app_version` を追加した。`tools/build-acceptance-package.js` は draft manifest に `cdk_app_version: packageJson.version` を出力しているが、`tools/check-acceptance-package.js` は draft manifest の required field list に `cdk_app_version` を含めていない。

このままだと、draft package preflight が schema required contract に追随していることを保証できない。

## 目的

acceptance package checker が draft evidence manifest の `cdk_app_version` を必須 field として検査し、package version と一致することを確認できるようにする。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点で evidence manifest schema は `cdk_app_version` を required としているが、`tools/check-acceptance-package.js` は draft package manifest の必須 field として `cdk_app_version` を検査していない。

### 確認済み事実

- `docs/acceptance/evidence/evidence_manifest.schema.json` の `required` は `cdk_app_version` を含む。
- `tools/check-evidence-manifest.js` は `cdk_app_version` を expected required として検査している。
- `tools/build-acceptance-package.js` は draft manifest に `cdk_app_version: packageJson.version` を出力している。
- `dist/acceptance/evidence_manifest.draft.json` は `cdk_app_version` を含む。
- `tools/check-acceptance-package.js` の required field loop は `cdk_app_version` を含まない。
- `tools/check-acceptance-package.js` は draft manifest の `cdk_app_version` が `package.json` の version と一致することを検査していない。

### 推定原因

- evidence manifest schema required が後から更新されたが、acceptance package draft checker の required field list が同時に更新されなかった。
- draft package check は外部 pending 状態の検査を中心に増えてきたため、CDK app version の package-level consistency check が不足していた。

### 根本原因

- evidence manifest schema と draft package checker の required contract を同期する検査が不足していた。
- `build-acceptance-package` が生成する version field と package metadata の一致を検証していなかった。

### 影響範囲

- `npm run acceptance:package:check`
- `dist/acceptance/evidence_manifest.draft.json`
- AC-001 / AC-002 の draft evidence manifest preflight

### 対策

- `tools/check-acceptance-package.js` の draft manifest required field loop に `github_release_url` と `cdk_app_version` を含め、schema required と合わせる。
- `package.json` を読み、draft manifest の `cdk_app_version` が `packageJson.version` と一致することを検査する。
- 外部 pending markers は維持し、final acceptance ready にはしない。

## スコープ

- 対象:
  - `tools/check-acceptance-package.js`
  - task/report
- 対象外:
  - draft manifest builder の出力変更
  - final evidence manifest 実ファイル作成
  - Git tag / GitHub Release / AWS deploy / signoff

## 実装計画

1. `tools/check-acceptance-package.js` で `package.json` を読み込む。
2. draft manifest required field list に `github_release_url` と `cdk_app_version` を明示する。
3. `manifest.cdk_app_version === packageJson.version` を検査する。
4. acceptance package / evidence / verify checks を実行する。
5. 作業レポート、commit、push、PR コメントまで反映する。

## ドキュメント保守計画

- 今回は checker の同期であり、既存 runbook は `cdk_app_version` 検証観点を持つため追加更新不要。

## 受け入れ条件

- [x] `tools/check-acceptance-package.js` が `cdk_app_version` を draft manifest required field として検査する。
- [x] `tools/check-acceptance-package.js` が `manifest.cdk_app_version` と `package.json` version の一致を検査する。
- [x] `github_release_url` も schema required として required loop に含まれる。
- [x] draft package は引き続き external pending を維持し、final acceptance ready を主張しない。
- [x] 外部状態を変更しない。

## Done 条件

- [ ] 実装差分が PR branch に commit / push されている。
- [ ] 受け入れ条件確認コメントとセルフレビューコメントを PR に投稿している。
- [ ] task md に PR コメント URL と検証結果を記録し、`tasks/done/` へ移動している。
- [ ] 作業レポートを `reports/working/` に保存している。

## 検証計画

- `npm run acceptance:package:check`
- `npm run evidence:check`
- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- `npm run acceptance:package:check`: pass
- `npm run evidence:check`: pass
- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run verify`: pass

## PR コメント

- 未投稿。PR push 後に受け入れ条件確認とセルフレビューを記録する。

## PR レビュー観点

- draft manifest の required fields が evidence schema と同期しているか。
- `cdk_app_version` の package version consistency check が過剰に final evidence を仮定していないか。
- 外部 pending 状態を弱めていないか。

## リスク

- package version を CDK app version として扱う前提を維持するため、CDK app version の決定方法を変更する場合は checker も更新が必要。
