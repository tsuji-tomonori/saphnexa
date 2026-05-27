# 作業完了レポート

保存先: `reports/working/20260527-1721-final-release-tag-url-consistency.md`

## 1. 受けた指示

- 主な依頼: `.workspace/Saphnexa_基本設計書_v0.16.md` をもとに実装し、`.workspace/local.md` を参考にローカル確認し、`.workspace/Saphnexa_検収受入条件_package_v1.0` を満たすまで作業を続ける。
- 今回の対象: final evidence candidate の `git_tag` と `github_release_url` の整合性検査を強化する。
- 条件: 外部状態を変える Git tag/release 作成、AWS deploy/publish、final checklist signoff は明示確認なしに実行しない。

## 2. 要件整理

| 要件ID | 指示・要件 | 重要度 | 対応状況 |
|---|---|---:|---|
| R1 | `github_release_url` が `git_tag` と異なる release tag URL を指す場合に検出する | 高 | 対応 |
| R2 | valid final evidence fixture は引き続き ready になる | 高 | 対応 |
| R3 | evidence manifest schema と runbook を validator と同期する | 中 | 対応 |
| R4 | 外部操作を実行せず pending 状態を維持する | 高 | 対応 |
| R5 | 関連検証と広い repository verify を実行する | 高 | 対応 |

## 3. 検討・判断したこと

- AC-001 は Git commit SHA、tag、GitHub release を証跡 manifest に記録して照合することを求めているため、URL 形式だけでなく `git_tag` と release URL の tag segment の一致を validator で検査する必要があると判断した。
- Git tag には URL encode が必要な文字が含まれる可能性があるため、`URL` と `decodeURIComponent` で `/releases/tag/` 以降を取り出して比較する方針にした。
- schema の `required` に `github_release_url` を含めたことで `tools/check-evidence-manifest.js` の期待 required fields も更新し、docs/schema/checker の不整合を解消した。
- 外部 release / AWS / signoff 操作は今回の範囲外とし、final candidate は `not ready` のまま維持した。

## 4. 実施作業

- `tools/final-evidence-candidate.js` に `manifest.github_release_url_git_tag` check を追加した。
- `tools/check-final-evidence-candidate-fixtures.js` に release URL/tag mismatch fixture を追加した。
- `docs/acceptance/evidence/evidence_manifest.schema.json` の required fields と説明を更新した。
- `tools/check-evidence-manifest.js` の schema required fields 検査を更新した。
- `docs/ops/runbooks/final-acceptance.md` の検証項目を具体化した。
- `tasks/do/20260527-1718-final-release-tag-url-consistency.md` に修正タスク、なぜなぜ分析、受け入れ条件、検証結果を記録した。

## 5. 成果物

| 成果物 | 形式 | 内容 | 指示との対応 |
|---|---|---|---|
| `tools/final-evidence-candidate.js` | JavaScript | final evidence manifest の release URL/tag 一致検査 | AC-001 の証跡照合を強化 |
| `tools/check-final-evidence-candidate-fixtures.js` | JavaScript | mismatch fixture の回帰検査 | validator 欠落の再発防止 |
| `docs/acceptance/evidence/evidence_manifest.schema.json` | JSON Schema | `github_release_url` required 化と説明追加 | schema と validator の同期 |
| `tools/check-evidence-manifest.js` | JavaScript | schema checker の required fields 更新 | 検証コマンドの整合性維持 |
| `docs/ops/runbooks/final-acceptance.md` | Markdown | final release URL/tag 一致要件の明文化 | 運用手順の同期 |
| `tasks/do/20260527-1718-final-release-tag-url-consistency.md` | Markdown | 作業 task と受け入れ条件 | Worktree Task PR Flow に対応 |

## 6. 実行した検証

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run evidence:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files docs/acceptance/evidence/evidence_manifest.schema.json docs/ops/runbooks/final-acceptance.md tools/check-evidence-manifest.js tools/check-final-evidence-candidate-fixtures.js tools/final-evidence-candidate.js tasks/do/20260527-1718-final-release-tag-url-consistency.md`: pass

## 7. Fit 評価

総合fit: 4.7 / 5.0（約94%）

理由: AC-001 の最終証跡照合でローカルに強化できる guard を追加し、validator、fixture、schema、runbook、checker を同期した。最終検収全体は Git tag/release、AWS deploy/publish、CloudFormation 実取得、final checklist signoff が未実施のため満点ではない。

## 8. 未対応・制約・リスク

- 未対応事項: Git tag/release 作成、AWS UAT deploy/publish、CloudFormation 実取得、final evidence files 作成、final checklist signoff。
- 制約: 外部状態変更は明示確認が必要なため実施していない。
- リスク: GitHub 以外の release URL 形式は既存方針どおり許容していない。
- 改善案: 外部操作実施後に `docs/acceptance/final/evidence_manifest.json`、`docs/acceptance/final/acceptance_checklist.csv`、`docs/acceptance/cloudformation/cloudformation_inventory.uat.json` を配置し、final candidate を `ready` にする。
