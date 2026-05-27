# final candidate fixture gate 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/local.md` をもとに、検収受入条件 package を満たすまで実装・検証を継続する。
- 未実施の外部検証や署名を完了扱いしない。

## 要件整理

- final candidate validator は、通常のローカル preflight では final files 未配置により `not_ready` を返す。
- 最終検収直前には final evidence manifest、final checklist、CloudFormation inventory が配置された状態で ready/invalid 分岐を正しく判定する必要がある。
- 実 GitHub release / AWS deploy / final signoff は外部 state 変更のため、このタスクでは fixture による validator 分岐検証に限定する。

## 検討・判断

- `tools/final-evidence-candidate.js` に path override を追加し、既定の final files パスは維持したまま fixture 検証で再利用できるようにした。
- ready fixture と invalid fixture を一時領域に作成し、実リポジトリの final evidence files を作らずに validator 分岐を検査した。
- `npm run verify` と CI workflow に fixture check を組み込み、今後の変更で final candidate validator の ready/invalid 分岐が壊れた場合に検出できるようにした。

## 実施作業

- `tools/final-evidence-candidate.js` を path override 対応に更新。
- `tools/check-final-evidence-candidate-fixtures.js` を追加。
- `package.json` に `acceptance:final-candidate:fixture:check` を追加し、`verify` に組み込み。
- `Taskfile.yml` と `.github/workflows/ci.yml` に fixture check を追加。
- `tools/check-ci-workflow.js` に CI command 検査を追加。
- `docs/ops/runbooks/final-acceptance.md` に fixture check 手順を追記。
- `tasks/do/20260527-1531-final-candidate-fixture-gate.md` を作成。

## 成果物

- `tools/check-final-evidence-candidate-fixtures.js`
- path override 対応の final candidate validator
- CI / verify に組み込まれた `npm run acceptance:final-candidate:fixture:check`
- `tasks/done/20260527-1531-final-candidate-fixture-gate.md`

## 検証

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass (`not_ready` expected)
- `npm run acceptance:final:check`: pass
- `npm run docs:check`: pass
- `npm run ci:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files ...`: pass
- GitHub Actions PR checks: pass
  - run `26495206771`: all jobs pass
  - run `26495208880`: all jobs pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552024966
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552026609
- task 完了更新セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552035821

## Fit 評価

- AC-001/002/004/081/150/151/152 の final files 配置後 gate を fixture で直接検査できるようになり、検収 package 最終提出前の安全性が上がった。
- fixture は外部証跡の代替ではないため、最終検収完了ではなく final candidate validator の検証強化として partial progress。

## 未対応・制約・リスク

- AC-001/002/004/081/150/151/152 は引き続き `requires_aws`。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence 作成、checklist signoff は未実行。
- GitHub Actions の最新実行結果は push 後に確認する。
