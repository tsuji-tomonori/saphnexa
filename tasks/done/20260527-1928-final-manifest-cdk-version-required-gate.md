# final manifest cdk version required gate

状態: done

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0` の完了条件は、検収対象 commit SHA、CDK stack、DB migration version、Docusaurus 設計書版、Allure レポート URL などを証跡マニフェストに記録することを求めている。repository 側では `docs/acceptance/evidence/evidence_manifest.schema.json` と draft package check で `cdk_app_version` を必須化済みだが、final evidence candidate の manifest required list には `cdk_app_version` が含まれていない。

## 目的

final evidence candidate gate が、最終 `evidence_manifest.json` から `cdk_app_version` が欠落した場合も、他の必須項目と同じ required field violation として検出する。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の PR branch で、`tools/final-evidence-candidate.js` の final manifest validator は `manifest.cdk_app_version` の値検査を行うが、required field list には `cdk_app_version` を含めていない。

### 確認済み事実

- `docs/acceptance/evidence/evidence_manifest.schema.json` は `cdk_app_version` を required に含めている。
- `tools/check-acceptance-package.js` は draft manifest の `cdk_app_version` と `package.json` version の一致を検査している。
- `tools/final-evidence-candidate.js` の `validateManifest()` は `isFinalText(manifest.cdk_app_version)` を検査している。
- 同 `required` 配列には `cdk_app_version` がない。

### 推定原因

- final candidate validator の required list と値検査 list が分離しており、draft/schema 側で追加された必須項目が final candidate required list に同期されていなかった。

### 根本原因

- final manifest の必須 field 増減に対して、required list 欠落を検出する regression fixture が不足していた。

### 影響範囲

- final candidate gate の診断粒度。`cdk_app_version` 欠落時も値検査では fail するが、required field 欠落として明示されない。
- 本修正は検収証跡 verifier のみで、API/UI/RAG 実行経路や認可境界は変更しない。

### 対策

- `tools/final-evidence-candidate.js` の final manifest required list に `cdk_app_version` を追加する。
- fixture check に `cdk_app_version` 欠落 manifest が required error を出すことを追加する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - 作業レポート
- 対象外:
  - Git tag / GitHub release 作成
  - AWS deploy / publish
  - CloudFormation 実環境 capture
  - final checklist signoff

## 実装計画

1. final manifest required list に `cdk_app_version` を追加する。
2. final candidate fixture で `cdk_app_version` 欠落時の required error を検査する。
3. 関連 acceptance checks と `npm run verify` を実行する。
4. 作業レポートを `reports/working/` に保存する。
5. commit / push 後、PR に受け入れ条件確認とセルフレビューを投稿する。

## ドキュメント保守計画

- verifier の挙動修正で、既存 docs schema は既に required 化済みのため追加 docs 更新は不要見込み。
- 作業結果と未実施外部 action は作業レポートと PR コメントに記録する。

## 受け入れ条件

- [x] final evidence candidate validator の required list に `cdk_app_version` が含まれる。
- [x] `cdk_app_version` 欠落 fixture が `manifest.cdk_app_version: required` を検出する。
- [x] 既存 final candidate fixture と acceptance package / evidence / verify checks が pass する。
- [x] 外部 state を変更せず、未実施外部 action を pending として維持する。

## Done 条件

- [x] 実装差分が PR branch に commit / push されている。
- [x] 受け入れ条件確認コメントとセルフレビューコメントを PR に投稿している。
- [x] task md に PR コメント URL と検証結果を記録し、`tasks/done/` へ移動している。
- [x] 作業レポートを `reports/working/` に保存している。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:package:check`
- `npm run evidence:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553719191
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553722360
- GitHub Apps comment は既知の 403 `Resource not accessible by integration` のため、`gh pr comment` fallback で投稿した。

## 検証結果

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass。final files 未配置のため `not ready` 表示、errors なし。
- `npm run acceptance:package:check`: pass
- `npm run evidence:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files tools/final-evidence-candidate.js tools/check-final-evidence-candidate-fixtures.js tasks/do/20260527-1928-final-manifest-cdk-version-required-gate.md reports/working/20260527-1930-final-manifest-cdk-version-required-gate.md`: pass

## PR レビュー観点

- final manifest の必須 field と docs schema / draft package checker が同期していること。
- 欠落 field の fixture が、値検査だけでなく required error を確認していること。
- 外部 state 変更を伴わず、final acceptance ready を誤って true にしないこと。

## リスク

- final candidate verifier の診断追加のみのため実行経路リスクは低い。
- 最終検収完了には引き続き外部 action が必要であり、この task 単体では goal 全体は完了しない。
