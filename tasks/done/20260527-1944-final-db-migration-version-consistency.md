# final db migration version consistency

状態: done

## 背景

検収完了条件は、検収対象 commit SHA、CDK stack、DB migration version、Docusaurus 設計書版、Allure レポート URL を証跡マニフェストに記録することを求めている。現行 final evidence candidate verifier は `db_migration.latest_version` が非 placeholder であることは検査するが、repository 内の Flyway migration ファイルと一致するかは検査していない。

## 目的

最終 `evidence_manifest.json` の `db_migration.latest_version` が、同じ commit の最新 Flyway migration ファイル名と一致することを final candidate gate で検出する。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の PR branch で、final evidence candidate verifier は `manifest.db_migration.latest_version` の文字列妥当性を検査するが、`packages/db-migrations/migrations/` の最新 Flyway SQL と一致するかを検査していない。

### 確認済み事実

- `packages/db-migrations/migrations/V001__initial_saphnexa_schema.sql` が存在する。
- `tools/check-db-migrations.js` は Flyway 形式と migration 内容を検査している。
- `tools/final-evidence-candidate.js` は `manifest.db_migration.latest_version` が final text であることのみ検査している。
- fixture の ready manifest は `V001__initial_saphnexa_schema.sql` を指定している。

### 推定原因

- DB migration 自体の検査と final evidence manifest の検査が別実装で、manifest の version consistency が final gate に取り込まれていなかった。

### 根本原因

- final candidate fixture に DB migration version 不一致ケースがなく、証跡マニフェストの migration version 誤記を検出できなかった。

### 影響範囲

- final evidence manifest の診断精度。存在するが誤った DB migration version が記録されても final candidate gate が通過し得る。
- 本修正は acceptance verifier のみで、API/UI/RAG 実行経路や認可境界は変更しない。

### 対策

- final candidate verifier で latest Flyway migration file を算出する。
- `manifest.db_migration.latest_version` と latest migration file name の一致を検査する。
- 不一致 fixture を追加し、`manifest.db_migration.latest_version_latest_file` error を検出する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - 作業レポート
- 対象外:
  - migration SQL の追加・変更
  - Git tag / GitHub release 作成
  - AWS deploy / publish
  - CloudFormation 実環境 capture
  - final checklist signoff

## 実装計画

1. final candidate verifier に latest Flyway migration file 算出を追加する。
2. `manifest.db_migration.latest_version` と latest migration file name の一致 check を追加する。
3. 不一致 fixture を追加する。
4. 関連 acceptance checks と `npm run verify` を実行する。
5. 作業レポートを `reports/working/` に保存する。
6. commit / push 後、PR に受け入れ条件確認とセルフレビューを投稿する。

## ドキュメント保守計画

- 既存の受入条件文書は DB migration version 記録を要求済みのため、追加 docs 更新は不要見込み。
- 作業結果と未実施外部 action は作業レポートと PR コメントに記録する。

## 受け入れ条件

- [x] final candidate verifier が repository 内の最新 Flyway migration file を算出する。
- [x] final `manifest.db_migration.latest_version` と latest migration file name の一致を検査する。
- [x] 不一致 fixture が `manifest.db_migration.latest_version_latest_file` を検出する。
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
- `npm run db:migration:check`
- `npm run acceptance:package:check`
- `npm run evidence:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553826318
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553830358
- GitHub Apps comment は既知の 403 `Resource not accessible by integration` のため、`gh pr comment` fallback で投稿した。

## 検証結果

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass。final files 未配置のため `not ready` 表示、errors なし。
- `npm run db:migration:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run evidence:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files tools/final-evidence-candidate.js tools/check-final-evidence-candidate-fixtures.js tasks/do/20260527-1944-final-db-migration-version-consistency.md reports/working/20260527-1946-final-db-migration-version-consistency.md`: pass

## PR レビュー観点

- final manifest の DB migration version が repository の latest Flyway migration と一致すること。
- fixture が version 不一致を明確な error label で検出していること。
- 外部 state 変更を伴わず、final acceptance ready を誤って true にしないこと。

## リスク

- final evidence manifest で repository と異なる DB migration version を許容していた運用がある場合、final candidate gate が fail する。ただし検収対象 commit の migration version 固定という目的上、fail させるのが妥当。
- 最終検収完了には引き続き外部 action が必要であり、この task 単体では goal 全体は完了しない。
