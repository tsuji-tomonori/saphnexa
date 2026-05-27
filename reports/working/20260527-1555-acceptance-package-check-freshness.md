# acceptance package check freshness 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/local.md` をもとに、検収受入条件 package を満たすまで実装・検証を継続する。
- 未実施の外部検証や署名を完了扱いしない。

## 要件整理

- `acceptance:package:check` は current Git ref 一致検査を持つ。
- 最新 commit 後に `dist/acceptance/*` が再生成されていない場合、単独 check は stale draft を検出して失敗する。
- 検証コマンドとしては、最新 draft を生成してから一致検査する導線が必要である。

## 検討・判断

- `acceptance:package:check` を build + checker の wrapper にした。
- これにより、単独実行でも current Git ref に合った draft package を生成してから検査できる。
- `verify` では既存どおり `acceptance:package:build` の後に `acceptance:package:check` が走るため、build が重複するが検証の安全側として許容した。

## 実施作業

- `package.json` の `acceptance:package:check` を `npm run acceptance:package:build && node tools/check-acceptance-package.js` に更新。
- `tasks/do/20260527-1551-acceptance-package-check-freshness.md` を作成。

## 成果物

- 単独実行で最新 draft を検査できる `npm run acceptance:package:check`
- `tasks/done/20260527-1551-acceptance-package-check-freshness.md`

## 検証

- `npm run acceptance:package:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files ...`: pass
- GitHub Actions PR checks: pass
  - run `26495854347`: all jobs pass
  - run `26495856134`: all jobs pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552160022
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552162163
- task 完了更新セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552172718

## Fit 評価

- stale draft による false failure を避けつつ、AC-001 の `git_commit_sha` current ref 一致検査を維持できるようになった。
- Git tag / release は未作成のため、AC-001 の final PASS ではなく local package check の再現性改善として partial progress。

## 未対応・制約・リスク

- AC-001/002/004/081/150/151/152 は引き続き `requires_aws`。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence 作成、checklist signoff は未実行。
- GitHub Actions の最新実行結果は push 後に確認する。
