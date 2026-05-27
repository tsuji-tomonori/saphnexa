# finalization command order gate 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/local.md` をもとに、検収受入条件 package を満たすまで実装・検証を継続する。
- 未実施の外部検証や署名を完了扱いしない。

## 要件整理

- final readiness は最終検収前の実行コマンド列を提示する。
- runbook / CI / verify には `acceptance:final-candidate:fixture:check` が含まれるが、`finalization_commands` には含まれていなかった。
- final candidate、final readiness、package の検査順序を runbook と同期し、checker で固定する必要がある。

## 検討・判断

- `finalization_commands` を external actions、fixture check、final candidate check、final readiness build/check、package build/check の順にした。
- `tools/check-final-acceptance-readiness.js` でこの順序を検査するようにした。
- CI workflow、`npm run verify`、local verification docs も fixture check を final-candidate check の前へそろえた。

## 実施作業

- `tools/final-acceptance-readiness.js` の `finalization_commands` を更新。
- `tools/check-final-acceptance-readiness.js` に command order check を追加。
- `.github/workflows/ci.yml`、`package.json`、`docs/ops/local-verification.md`、`tools/check-docs.js` を同じ順序に更新。
- `tasks/do/20260527-1559-finalization-command-order-gate.md` を作成。

## 成果物

- runbook / CI / verify と同期した finalization command list
- final readiness command order checker
- `tasks/done/20260527-1559-finalization-command-order-gate.md`

## 検証

- `npm run acceptance:final:build`: pass
- `npm run acceptance:final:check`: pass
- `npm run docs:check`: pass
- `npm run ci:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files ...`: pass
- GitHub Actions PR checks: pass
  - run `26496284143`: all jobs pass
  - run `26496285691`: all jobs pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552230701
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552232305
- task 完了更新セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552241036

## Fit 評価

- final acceptance の直前検証順序を機械検査できるようになり、AC-001/002/004/081/150/151/152 の最終提出手順の再現性が上がった。
- 外部証跡そのものは作成していないため、final PASS ではなく最終化手順 gate の整合性強化として partial progress。

## 未対応・制約・リスク

- AC-001/002/004/081/150/151/152 は引き続き `requires_aws`。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence 作成、checklist signoff は未実行。
- GitHub Actions の最新実行結果は push 後に確認する。
