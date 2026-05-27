# final release repository consistency gate

状態: done

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0` の AC-001 は、検収対象の Git commit SHA、tag、GitHub release を証跡 manifest に記録して照合することを求めている。現状の final evidence candidate validator は、`github_release_url` が GitHub release URL であり、`git_tag` と同じ tag を指すことを検査するが、その release URL が現在の repository を指すことまでは検査していない。

## 目的

final evidence candidate の検査で、`github_release_url` が現在の repository 以外の GitHub release を指す場合を検出し、別 repository の release URL で AC-001 を満たした扱いにしない。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の final evidence candidate validator で、`github_release_url` が別 GitHub repository の release URL でも、tag segment が `git_tag` と一致していれば manifest 検査を通過し得る。

### 確認済み事実

- `tools/final-evidence-candidate.js` は `github_release_url` が `https://github.com/` で始まることを検査している。
- `tools/final-evidence-candidate.js` は `github_release_url` の `/releases/tag/<tag>` が `manifest.git_tag` と一致することを検査している。
- `tools/final-evidence-candidate.js` は release URL の owner/repo が現在の Git remote と一致することを検査していない。
- `tools/git-context.js` には現在 commit と tag commit の helper はあるが、現在 repository を解決する helper はない。

### 推定原因

- release URL の形式検査と tag 一致検査を段階的に追加した際、repository owner/name の相関検査が後続課題として残った。
- fixture が tag mismatch を扱う一方、別 repository URL の不正を扱っていなかった。

### 根本原因

- AC-001 の「GitHub release evidence」が現在の検収対象 repository に属することを validator の不変条件として明示していなかった。
- Git remote 由来の repository identity を fixture で注入して検査する仕組みが不足していた。

### 影響範囲

- final evidence candidate validator。
- AC-001 / AC-150 / AC-151 / AC-152 の最終判定前 preflight。
- final acceptance runbook の検証項目。

### 対策

- Git remote origin から `owner/repo` を解決する helper を追加する。
- `github_release_url` の repository path が現在 repository と一致することを validator に追加する。
- fixture に別 repository release URL の invalid ケースを追加する。
- runbook に GitHub release URL が検収対象 repository の release であることを明記する。

## スコープ

- 対象:
  - `tools/git-context.js`
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - `docs/ops/runbooks/final-acceptance.md`
- 対象外:
  - GitHub release 作成
  - Git tag 作成や push
  - AWS deploy / publish
  - final checklist signoff

## 実装計画

1. `tools/git-context.js` に current repository `owner/repo` を解決する helper を追加する。
2. `github_release_url` から owner/repo と tag を取り出す helper を追加する。
3. final evidence candidate validator に release URL repository consistency check を追加する。
4. fixture に wrong repository release URL ケースを追加する。
5. runbook と task に検証結果を記録する。

## ドキュメント保守計画

- `docs/ops/runbooks/final-acceptance.md` に、GitHub release URL が検収対象 repository の release URL であることを追記する。

## 受け入れ条件

- [x] `github_release_url` が現在 repository 以外の release URL の場合、validator が invalid として検出する。
- [x] valid fixture は現在 repository を注入した状態で引き続き ready と判定される。
- [x] runbook が GitHub release URL と検収対象 repository の一致要件を明記する。
- [x] 外部状態を変更せず、release / AWS / final signoff の pending 状態を維持する。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run docs:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files docs/ops/runbooks/final-acceptance.md tools/git-context.js tools/final-evidence-candidate.js tools/check-final-evidence-candidate-fixtures.js tasks/done/20260527-1748-final-release-repo-consistency.md`: pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552986516
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552989656
- GitHub Apps comment は既に 403 `Resource not accessible by integration` を確認済みのため、`gh pr comment` で代替した。

## PR レビュー観点

- HTTPS と SSH 形式の Git remote から owner/repo を正しく解決できるか。
- release URL の owner/repo と tag を過不足なく検査しているか。
- 既存の release URL/tag consistency check を弱めていないか。
- 外部状態変更が含まれていないか。

## リスク

- origin remote が設定されていない環境では repository consistency check は invalid になる。CI/最終検収では remote がある前提。
- GitHub Enterprise URL は現状対象外。検収 package は GitHub.com release URL を前提としている。
