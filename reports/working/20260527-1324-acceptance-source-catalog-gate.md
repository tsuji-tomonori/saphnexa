# acceptance source catalog gate 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/local.md` の方針に従い、検収受入条件 package を満たすまで実装・検証を継続する。
- 実施していない外部検証を完了扱いせず、ローカルで確認できる範囲を機械検査へ寄せる。

## 要件整理

- `.workspace/Saphnexa_検収受入条件_package_v1.0` の検収チェックリストは worktree 外にあり、CI から直接参照できない。
- traceability と draft checklist が元 checklist の ID、領域、重要度からずれていないことを検査する必要がある。
- 残る外部作業は Git tag/release、AWS deploy/publish、CloudFormation capture、final signoff であり、このタスクでは実行しない。

## 検討・判断

- `.workspace` の CSV 全文を直接 CI 依存にせず、`docs/acceptance/source/acceptance_catalog.json` として source snapshot をリポジトリ内に固定した。
- source catalog には source checksum、102 行、P0/P1/P2 件数、領域、検収項目、受け入れ条件、証跡、確認方法を保持した。
- `tools/acceptance-ids.js` の hard-coded ID 一覧を catalog 由来にし、priority 集計も catalog から算出するようにした。

## 実施作業

- `docs/acceptance/source/acceptance_catalog.json` を追加。
- `tools/check-acceptance-source-catalog.js` を追加し、catalog、traceability、存在する draft checklist の同期を検査。
- readiness と acceptance package に source catalog path、件数、priority counts を追加。
- draft checklist に `area`、`priority`、`item` を追加し、package check で catalog と照合。
- `package.json`、Taskfile、CI、admin report、docs check、local verification docs を同期。

## 成果物

- `docs/acceptance/source/acceptance_catalog.json`
- `tools/check-acceptance-source-catalog.js`
- `npm run acceptance:source:check`
- 更新後の readiness/package source catalog gate
- `tasks/done/20260527-1316-acceptance-source-catalog-gate.md`

## 検証

- `npm run acceptance:source:check`: pass
- `npm run acceptance:check`: pass
- `npm run acceptance:external-actions:build`: pass
- `npm run acceptance:external-actions:check`: pass
- `npm run acceptance:final:build`: pass
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:build`: pass
- `npm run acceptance:package:check`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `npm run admin-artifacts:build`: pass
- `npm run artifacts:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files ...`: pass
- PR #1 GitHub Actions: run `26490764547` / `26490765787` の 14 jobs が pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4551264269
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4551266879
- task 完了更新セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4551334657

## Fit 評価

- 元検収 checklist の ID/領域/重要度を CI で検査できる形にしたため、AC-004 と AC-150/151/152 のローカル検収性が向上した。
- 実外部作業は実行していないため、最終検収完了ではなく final acceptance 前の整合 gate 強化として partial progress。

## 未対応・制約・リスク

- AC-001/002/004/081/150/151/152 は引き続き `requires_aws`。
- Git tag/release、AWS deploy/publish、CloudFormation 実 capture、final evidence 作成、checklist signoff は未実行。
- `.workspace` の検収 package が更新された場合、source catalog snapshot の再生成と checksum 更新が必要。
- レポート更新 commit 後の GitHub Actions は別途確認する。
