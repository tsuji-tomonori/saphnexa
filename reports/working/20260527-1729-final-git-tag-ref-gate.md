# 作業完了レポート

保存先: `reports/working/20260527-1729-final-git-tag-ref-gate.md`

## 1. 受けた指示

- 主な依頼: `.workspace/Saphnexa_基本設計書_v0.16.md` をもとに実装し、`.workspace/local.md` を参考にローカル確認し、`.workspace/Saphnexa_検収受入条件_package_v1.0` を満たすまで作業を続ける。
- 今回の対象: final evidence candidate の `git_tag` が実在し、manifest の `git_commit_sha` と同じ commit を指すことを検査する。
- 条件: Git tag 作成、GitHub release 作成、AWS deploy/publish、final checklist signoff などの外部状態変更は明示確認なしに実行しない。

## 2. 要件整理

| 要件ID | 指示・要件 | 重要度 | 対応状況 |
|---|---|---:|---|
| R1 | `git_tag` が存在しない場合に invalid として検出する | 高 | 対応 |
| R2 | `git_tag` が `git_commit_sha` と異なる commit を指す場合に invalid として検出する | 高 | 対応 |
| R3 | valid fixture は tag ref を注入した状態で ready を維持する | 高 | 対応 |
| R4 | runbook に Git tag ref / current commit 一致要件を明記する | 中 | 対応 |
| R5 | 外部操作を実行せず pending 状態を維持する | 高 | 対応 |

## 3. 検討・判断したこと

- AC-001 は検収対象 commit SHA と tag の固定を求めるため、manifest の文字列だけでなく repository 上の tag ref を検査する必要があると判断した。
- annotated tag と lightweight tag の解決差異を手書きで扱わないため、`git rev-list -n 1 <tag>` に commit 解決を委譲した。
- fixture では実 repository に tag を作成せず、`resolveGitTagCommit` を注入して ready、missing tag、wrong commit の各分岐を検査した。
- final evidence files は未配置のままなので、実 final candidate は引き続き `not ready` を正常報告する。

## 4. 実施作業

- `tools/git-context.js` に `gitTagCommit` helper を追加した。
- `tools/final-evidence-candidate.js` に `manifest.git_tag_ref` と `manifest.git_tag_commit` の検査を追加した。
- `tools/check-final-evidence-candidate-fixtures.js` に tag resolver injection、missing tag ref、wrong tag commit の回帰検査を追加した。
- `docs/ops/runbooks/final-acceptance.md` に `git_tag` が検証実行時の Git ref と同じ commit を指す要件を追記した。
- `tasks/do/20260527-1726-final-git-tag-ref-gate.md` に修正タスク、なぜなぜ分析、受け入れ条件、検証結果を記録した。

## 5. 成果物

| 成果物 | 形式 | 内容 | 指示との対応 |
|---|---|---|---|
| `tools/git-context.js` | JavaScript | Git tag から commit SHA を解決する helper | AC-001 の tag 固定検査に対応 |
| `tools/final-evidence-candidate.js` | JavaScript | final manifest の tag ref / commit 一致検査 | final acceptance preflight を強化 |
| `tools/check-final-evidence-candidate-fixtures.js` | JavaScript | tag ref fixture の正常/異常系検査 | 回帰防止 |
| `docs/ops/runbooks/final-acceptance.md` | Markdown | final tag ref 検証要件の追記 | 運用手順の同期 |
| `tasks/do/20260527-1726-final-git-tag-ref-gate.md` | Markdown | 作業 task と受け入れ条件 | Worktree Task PR Flow に対応 |

## 6. 実行した検証

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files docs/ops/runbooks/final-acceptance.md tools/git-context.js tools/final-evidence-candidate.js tools/check-final-evidence-candidate-fixtures.js tasks/do/20260527-1726-final-git-tag-ref-gate.md`: pass

## 7. Fit 評価

総合fit: 4.7 / 5.0（約94%）

理由: AC-001 の「Git tag で検収対象を固定する」要件に対し、外部操作なしで検査可能な repository ref guard を追加し、fixture と runbook を同期した。最終検収全体は Git tag/release、AWS deploy/publish、CloudFormation 実取得、final checklist signoff が未実施のため満点ではない。

## 8. 未対応・制約・リスク

- 未対応事項: Git tag/release 作成、AWS UAT deploy/publish、CloudFormation 実取得、final evidence files 作成、final checklist signoff。
- 制約: 外部状態変更は明示確認が必要なため実施していない。
- リスク: 最終検収実行環境で tag が fetch されていない場合、tag ref 検査は invalid になる。
- 改善案: 最終検収前の手順に検収対象 tag の fetch 確認を含める。
