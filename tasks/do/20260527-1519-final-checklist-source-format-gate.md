# final checklist source format gate

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-27 15:19 JST
- 対象 PR: #1

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0/Saphnexa_検収チェックリスト_v1.0.csv` の列は `ID,領域,検収項目,...,結果,証跡リンク,確認者,確認日,備考` である。一方、現状の final candidate validator は英語列 `result/evidence_link/reviewer/checked_date` を前提にしており、最終提出 checklist の source CSV 形式との同期が弱い。

## 目的

検収 checklist の source columns をリポジトリ内に固定し、draft/final checklist が元 checklist 形式から逸脱しないことを機械検査する。

## スコープ

- source catalog に `source_columns` を追加する。
- checklist column helper を追加し、draft package と final candidate validator の列検査を source 形式へ寄せる。
- draft checklist を source CSV 互換列で生成する。
- package/source/final candidate check と docs/runbook を同期する。
- 実 final checklist signoff は実行しない。

## 実装チェックリスト

- [x] source columns を catalog に追加する。
- [x] draft checklist を source CSV 互換列で生成する。
- [x] package check / source check / final candidate validator で source columns を検査する。
- [x] final acceptance runbook を source CSV 形式に合わせる。
- [x] 対象検証と `npm run verify` を通す。
- [ ] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- `npm run acceptance:source:check` が source columns と draft checklist columns を検査して pass する。
- `npm run acceptance:package:check` が source CSV 互換 draft checklist を検査して pass する。
- `npm run acceptance:final-candidate:check` が final checklist source columns を検査対象にする。
- `npm run verify`、`git diff --check`、pre-commit が pass する。

## 受け入れ条件

- AC-004: 最終 checklist の必須列が元検収 checklist の列と一致し、全行の `結果/証跡リンク/確認者/確認日` が空でないことを検査できる。
- AC-150/151/152: final checklist の全行 `結果=PASS` を source CSV 列で判定できる。
- AC-001/002: checklist の証跡リンク列が final evidence manifest / GitHub release / AWS 証跡 URL と紐づけ可能な列として維持される。

## 検証計画

- `npm run acceptance:source:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:package:build`
- `npm run acceptance:package:check`
- `npm run docs:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## リスク・制約

- 既存 draft checklist の列名が変わるため、関連 checker を同時に更新する。
- final checklist signoff、Git tag/release、AWS deploy/publish、CloudFormation capture は未実行のまま。
