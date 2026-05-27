# final cdk version package consistency

状態: done

## 背景

final evidence candidate verifier は `cdk_app_version` の存在と非 placeholder 性を検査するが、現時点では `package.json` の version との一致を検査していない。一方、draft acceptance package checker は draft manifest の `cdk_app_version` と `package.json` version の一致を検査している。

## 目的

最終 `evidence_manifest.json` の `cdk_app_version` が、同じ commit の `package.json` version と一致することを final candidate gate で検出する。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の PR branch で、final evidence candidate verifier は `manifest.cdk_app_version` の文字列妥当性を検査するが、`package.json` version との一致を検査していない。

### 確認済み事実

- `tools/check-acceptance-package.js` は draft manifest の `manifest.cdk_app_version === packageJson.version` を検査する。
- `tools/final-evidence-candidate.js` は `isFinalText(manifest.cdk_app_version)` を検査する。
- `tools/final-evidence-candidate.js` は `package.json` を読んでいない。
- ready fixture の `cdk_app_version` は現行 `package.json` version と同じ `0.1.0` になっている。

### 推定原因

- draft package gate と final candidate gate の version consistency 観点が別々に実装され、final 側へ一致条件が同期されていなかった。

### 根本原因

- final candidate fixture に `cdk_app_version` と package version の不一致ケースがなく、同期漏れを検出できなかった。

### 影響範囲

- final evidence manifest の診断精度。存在するが誤った CDK app version が記録されても final candidate gate が通過し得る。
- 本修正は acceptance verifier のみで、API/UI/RAG 実行経路や認可境界は変更しない。

### 対策

- final candidate verifier で `package.json` を読み、`manifest.cdk_app_version === packageJson.version` を検査する。
- 不一致 fixture を追加し、`manifest.cdk_app_version_package_version` error を検出する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - 作業レポート
- 対象外:
  - package version の変更
  - Git tag / GitHub release 作成
  - AWS deploy / publish
  - CloudFormation 実環境 capture
  - final checklist signoff

## 実装計画

1. final candidate verifier に `package.json` version 読み込みを追加する。
2. `manifest.cdk_app_version` と package version の一致 check を追加する。
3. 不一致 fixture を追加する。
4. 関連 acceptance checks と `npm run verify` を実行する。
5. 作業レポートを `reports/working/` に保存する。
6. commit / push 後、PR に受け入れ条件確認とセルフレビューを投稿する。

## ドキュメント保守計画

- 既存 schema と draft package checker はすでに `cdk_app_version` を扱っているため、追加 docs 更新は不要見込み。
- 作業結果と未実施外部 action は作業レポートと PR コメントに記録する。

## 受け入れ条件

- [x] final candidate verifier が `package.json` version を読み込む。
- [x] final `manifest.cdk_app_version` と package version の一致を検査する。
- [x] 不一致 fixture が `manifest.cdk_app_version_package_version` を検出する。
- [x] 関連 acceptance / evidence / verify checks が pass する。
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

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553765347
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553768045
- GitHub Apps comment は既知の 403 `Resource not accessible by integration` のため、`gh pr comment` fallback で投稿した。

## 検証結果

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass。final files 未配置のため `not ready` 表示、errors なし。
- `npm run acceptance:package:check`: pass
- `npm run evidence:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files tools/final-evidence-candidate.js tools/check-final-evidence-candidate-fixtures.js tasks/do/20260527-1935-final-cdk-version-package-consistency.md reports/working/20260527-1937-final-cdk-version-package-consistency.md`: pass

## PR レビュー観点

- draft package と final candidate の `cdk_app_version` consistency check が揃っていること。
- fixture が version 不一致を明確な error label で検出していること。
- 外部 state 変更を伴わず、final acceptance ready を誤って true にしないこと。

## リスク

- final evidence manifest で package version と異なる CDK app version を許容していた運用がある場合、final candidate gate が fail する。ただし検収対象 commit の CDK app version 固定という目的上、fail させるのが妥当。
- 最終検収完了には引き続き外部 action が必要であり、この task 単体では goal 全体は完了しない。
