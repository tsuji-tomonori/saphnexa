# final manifest git ref gate 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/local.md` をもとに、検収受入条件 package を満たすまで実装・検証を継続する。
- 未実施の外部検証や署名を完了扱いしない。

## 要件整理

- AC-001 では検収対象 Git commit SHA の固定が求められる。
- final candidate validator は `git_commit_sha` の形式と非 placeholder は検査していたが、検証実行時の Git ref との一致までは検査していなかった。
- final evidence manifest が別 commit の証跡を指すことを防ぐ必要がある。

## 検討・判断

- 既存の `tools/git-context.js` を final candidate validator でも使い、`manifest.git_commit_sha` と current Git ref を比較することにした。
- ready fixture は current Git ref を使うようにし、invalid fixture では commit mismatch を明示的に検出するようにした。
- Git tag / GitHub release 作成は外部 state 変更のため、このタスクでは実行していない。

## 実施作業

- `tools/final-evidence-candidate.js` に `manifest.git_commit_sha_current_ref` check を追加。
- `tools/check-final-evidence-candidate-fixtures.js` を current Git ref 追随と mismatch 検査に更新。
- `docs/ops/runbooks/final-acceptance.md` に final evidence manifest の Git ref 一致確認を追記。
- `tasks/do/20260527-1610-final-manifest-git-ref-gate.md` を作成。

## 成果物

- final evidence manifest の current Git ref 一致検査
- current ref / mismatch を検査する final candidate fixture
- `tasks/done/20260527-1610-final-manifest-git-ref-gate.md`

## 検証

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass (`not_ready` expected)
- `npm run docs:check`: pass
- `npm run verify`: pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552297481
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552301105

## Fit 評価

- final evidence manifest が検証対象 commit 以外を指していても通過する余地を減らし、AC-001 の commit 固定証跡の信頼性が上がった。
- Git tag / release は未作成のため、AC-001 の final PASS ではなく final candidate gate の強化として partial progress。

## 未対応・制約・リスク

- AC-001/002/004/081/150/151/152 は引き続き `requires_aws`。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence 作成、checklist signoff は未実行。
- GitHub Actions の最新実行結果は push 後に確認する。
