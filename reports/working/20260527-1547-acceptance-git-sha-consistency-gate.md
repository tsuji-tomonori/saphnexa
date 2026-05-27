# acceptance git sha consistency gate 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/local.md` をもとに、検収受入条件 package を満たすまで実装・検証を継続する。
- 未実施の外部検証や署名を完了扱いしない。

## 要件整理

- AC-001 では検収対象 Git commit SHA の固定が求められる。
- draft acceptance package は `git_commit_sha` を持つが、従来の `acceptance:package:check` は 40 桁 hex 形式だけを確認していた。
- manifest / summary が現在の Git ref と一致しない古い draft を誤って参照しないよう、package check で一致検査する必要がある。

## 検討・判断

- `tools/build-acceptance-package.js` 内にあった Git ref 解決処理を `tools/git-context.js` に分離した。
- `tools/check-acceptance-package.js` でも同じ helper を使い、manifest / summary / current Git ref の一致を検査するようにした。
- Git tag / GitHub release 作成は外部 state 変更のため、このタスクでは実行していない。

## 実施作業

- `tools/git-context.js` を追加。
- `tools/build-acceptance-package.js` を共通 Git helper 利用へ更新。
- `tools/check-acceptance-package.js` に `git_commit_sha` consistency check を追加。
- `docs/ops/runbooks/final-acceptance.md` に draft package の Git ref 一致検証を追記。
- `tasks/do/20260527-1542-acceptance-git-sha-consistency-gate.md` を作成。

## 成果物

- `tools/git-context.js`
- current Git ref と一致する draft package `git_commit_sha` 検査
- `tasks/done/20260527-1542-acceptance-git-sha-consistency-gate.md`

## 検証

- `npm run acceptance:package:build`: pass
- `npm run acceptance:package:check`: pass
- `npm run acceptance:final:check`: pass
- `npm run docs:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files ...`: pass
- GitHub Actions PR checks: pass
  - run `26495561664`: all jobs pass
  - run `26495563256`: all jobs pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552102332
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552105106
- task 完了更新セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552113944

## Fit 評価

- draft evidence manifest と summary が現在の Git ref を指すことを検査できるようになり、AC-001 の commit 固定証跡の信頼性が上がった。
- Git tag / release は未作成のため、AC-001 の final PASS ではなく local draft package の整合性強化として partial progress。

## 未対応・制約・リスク

- AC-001/002/004/081/150/151/152 は引き続き `requires_aws`。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence 作成、checklist signoff は未実行。
- GitHub Actions の最新実行結果は push 後に確認する。
