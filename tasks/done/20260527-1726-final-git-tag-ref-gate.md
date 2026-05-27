# final git tag ref gate

状態: done

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0` の AC-001 は、検収対象の Git commit SHA と Git tag を証跡 manifest に記録し、GitHub release と照合することを求めている。現状の final evidence candidate validator は `git_commit_sha` が現在の Git ref と一致すること、`github_release_url` が `git_tag` と同じ URL tag を指すことを検査するが、`git_tag` 自体が repository に存在して現在 commit を指すことまでは検査していない。

## 目的

final evidence candidate の検査で、manifest の `git_tag` が実在しない、または現在の検収対象 commit と異なる commit を指す場合を検出する。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の final evidence candidate validator で、`git_tag` が repository 内に存在しない値でも、placeholder でなく release URL と文字列一致していれば manifest 検査を通過し得る。

### 確認済み事実

- `tools/final-evidence-candidate.js` は `manifest.git_commit_sha_current_ref` を検査している。
- `tools/final-evidence-candidate.js` は `manifest.github_release_url_git_tag` を検査している。
- `tools/final-evidence-candidate.js` は `manifest.git_tag` の実在性や tag の指す commit を検査していない。
- `docs/ops/runbooks/final-acceptance.md` は Git tag と GitHub release が作成済みであることを前提にしている。

### 推定原因

- 初期の final candidate validator は manifest 内の値の形式と相互整合性に重点を置き、repository 参照として存在するかの検査が後回しになった。
- fixture は ready/invalid の値検査を主に扱い、Git repository state を注入して検査する仕組みがなかった。

### 根本原因

- AC-001 の「Git tag による検収対象固定」を、manifest 文字列だけでなく repository ref として検査する責務が validator に明示されていなかった。
- Git ref 依存の検査を fixture で再現できる injection point が不足していた。

### 影響範囲

- final evidence candidate validator。
- AC-001 / AC-150 / AC-151 / AC-152 の最終判定前 preflight。
- final acceptance runbook の検証項目。

### 対策

- `git_tag` が存在し、`git_commit_sha` と同じ commit を指すことを validator に追加する。
- fixture では Git tag lookup を注入し、ready / missing tag / wrong commit の各分岐を検査する。
- runbook に tag ref が current commit を指すことを明記する。

## スコープ

- 対象:
  - `tools/git-context.js`
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - `docs/ops/runbooks/final-acceptance.md`
- 対象外:
  - Git tag の作成や push
  - GitHub release 作成
  - AWS deploy / publish
  - final checklist signoff

## 実装計画

1. Git tag から commit SHA を解決する helper を追加する。
2. final evidence candidate validator に tag ref / manifest commit の一致検査を追加する。
3. fixture で tag resolver を注入し、ready / missing / wrong commit を検査する。
4. final acceptance runbook を同期する。
5. 関連検証を実行する。

## ドキュメント保守計画

- `docs/ops/runbooks/final-acceptance.md` の検証項目に、`git_tag` が検証実行時の Git ref と同じ commit を指すことを追加する。

## 受け入れ条件

- [x] final evidence manifest の `git_tag` が存在しない場合、validator が invalid として検出する。
- [x] final evidence manifest の `git_tag` が `git_commit_sha` と異なる commit を指す場合、validator が invalid として検出する。
- [x] valid fixture は tag ref を注入した状態で引き続き ready と判定される。
- [x] runbook が Git tag ref と current commit の一致要件を明記する。
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
- `pre-commit run --files docs/ops/runbooks/final-acceptance.md tools/git-context.js tools/final-evidence-candidate.js tools/check-final-evidence-candidate-fixtures.js tasks/done/20260527-1726-final-git-tag-ref-gate.md`: pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552828519
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552830665
- GitHub Apps comment は既に 403 `Resource not accessible by integration` を確認済みのため、`gh pr comment` で代替した。

## PR レビュー観点

- tag が存在しない場合と別 commit を指す場合を区別して検出できるか。
- annotated tag / lightweight tag の基本的な解決を `git` に委譲しているか。
- fixture が実 repository に tag を作成せずに検査できるか。
- 外部状態変更が含まれていないか。

## リスク

- `git` コマンドが存在しない環境では tag ref 検査が失敗する。repository validation / CI では Git が前提のため許容する。
- shallow clone で tag object が取得されていない場合は invalid になる。最終検収時は検収対象 tag を fetch してから実行する必要がある。
