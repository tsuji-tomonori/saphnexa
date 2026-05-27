# final checklist source format gate 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/local.md` をもとに、検収受入条件 package を満たすまで実装・検証を継続する。
- 未実施の外部検証や署名を完了扱いしない。

## 要件整理

- 元検収 checklist CSV の列は `ID,領域,検収項目,受け入れ条件 / 完了条件,定量基準,監査証跡,確認方法,重要度,結果,証跡リンク,確認者,確認日,備考` である。
- 最終 candidate validator は英語列を前提にしていたため、source CSV 形式の最終 checklist との同期が弱かった。
- AC-004/150/151/152 の最終判定では、source CSV 列で全行 `結果=PASS` と証跡・確認者・確認日を確認する必要がある。

## 検討・判断

- `docs/acceptance/source/acceptance_catalog.json` に `source_columns` を追加し、列順を固定した。
- `tools/acceptance-checklist-format.js` を追加し、source columns と `結果/証跡リンク/確認者/確認日` の共通参照を一本化した。
- draft checklist も source CSV 互換列で生成し、ローカル package と最終 candidate の形式を揃えた。

## 実施作業

- source catalog に checklist source columns を追加。
- `tools/build-acceptance-package.js` を更新し、draft checklist を source CSV 互換列で生成。
- `tools/check-acceptance-source-catalog.js` と `tools/check-acceptance-package.js` で source columns、領域、重要度、検収項目、受け入れ条件を検査。
- `tools/final-evidence-candidate.js` で final checklist source columns と `結果=PASS` を検査。
- `docs/ops/runbooks/final-acceptance.md` を source CSV 列の手順に更新。

## 成果物

- `tools/acceptance-checklist-format.js`
- source CSV 互換の `dist/acceptance/acceptance_checklist.draft.csv`
- 更新後の final candidate checklist validator
- `tasks/done/20260527-1519-final-checklist-source-format-gate.md`

## 検証

- `npm run acceptance:package:build`: pass
- `npm run acceptance:source:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run acceptance:final-candidate:check`: pass (`not_ready` expected)
- `npm run docs:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files ...`: pass

## Fit 評価

- final checklist の列形式を source CSV と同期し、AC-004/150/151/152 の最終判定を元 checklist 形式で検査できるようにしたため、検収 package への適合度が上がった。
- 実 final signoff は未実行のため、最終検収完了ではなく checklist 提出前 gate の強化として partial progress。

## 未対応・制約・リスク

- AC-001/002/004/081/150/151/152 は引き続き `requires_aws`。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence 作成、checklist signoff は未実行。
- `.workspace` の checklist 列が変わった場合、source catalog と checker の再同期が必要。
- GitHub Actions の最新実行結果は push 後に確認する。
