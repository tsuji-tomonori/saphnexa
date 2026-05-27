# final cost assumption gate

状態: doing

## 背景

AC-140 は「想定50 DAU/10質問日で月額見積 <= 550 USD」を検収条件としている。`npm run cost:check` は local cost estimate の `assumption` に `50 DAU` と `10 questions/user/day` が含まれることを検査しているが、final evidence candidate verifier は `cost_estimate.assumption` が非 placeholder であることのみ検査している。

## 目的

最終 `evidence_manifest.json` の `cost_estimate.assumption` が、AC-140 の 50 DAU / 10 questions/user/day 前提を明示することを final candidate gate で検出する。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の PR branch で、final evidence candidate verifier は `cost_estimate.monthly_usd <= 550` と non-placeholder assumption を検査するが、見積前提が AC-140 の 50 DAU / 10 questions/user/day と一致するかを検査していない。

### 確認済み事実

- `tools/check-cost-estimate.js` は `localCostEstimate.assumption` に `50 DAU` と `10 questions/user/day` が含まれることを検査している。
- `docs/acceptance/source/acceptance_catalog.json` の AC-140 は「想定50 DAU/10質問日で月額見積 <= 550 USD」を定量基準としている。
- `tools/final-evidence-candidate.js` は `cost_estimate.assumption` が final text であることのみ検査している。
- ready fixture の `cost_estimate.assumption` は `50 DAU and 10 questions/user/day` を含んでいる。

### 推定原因

- local cost estimate checker と final evidence manifest checker が別実装で、final manifest に AC-140 の前提語句 consistency が取り込まれていなかった。

### 根本原因

- final candidate fixture に cost assumption の前提欠落ケースがなく、月額上限だけ満たす不十分な見積前提を検出できなかった。

### 影響範囲

- final evidence manifest の診断精度。月額 USD は上限内でも、検収前提と異なる cost estimate が記録されても final candidate gate が通過し得る。
- 本修正は acceptance verifier のみで、API/UI/RAG 実行経路や認可境界は変更しない。

### 対策

- final candidate verifier で `cost_estimate.assumption` に `50 DAU` と `10 questions/user/day` が含まれることを検査する。
- 前提欠落 fixture を追加し、`manifest.cost_estimate.assumption_usage_basis` error を検出する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - 作業レポート
- 対象外:
  - cost estimate の金額や line items の変更
  - Git tag / GitHub release 作成
  - AWS deploy / publish
  - CloudFormation 実環境 capture
  - final checklist signoff

## 実装計画

1. final candidate verifier に cost assumption usage basis check を追加する。
2. 前提欠落 fixture を追加する。
3. 関連 acceptance checks と `npm run verify` を実行する。
4. 作業レポートを `reports/working/` に保存する。
5. commit / push 後、PR に受け入れ条件確認とセルフレビューを投稿する。

## ドキュメント保守計画

- 既存 acceptance catalog と local cost checker は前提を明示済みのため、追加 docs 更新は不要見込み。
- 作業結果と未実施外部 action は作業レポートと PR コメントに記録する。

## 受け入れ条件

- [ ] final candidate verifier が `cost_estimate.assumption` の `50 DAU` 前提を検査する。
- [ ] final candidate verifier が `cost_estimate.assumption` の `10 questions/user/day` 前提を検査する。
- [ ] 前提欠落 fixture が `manifest.cost_estimate.assumption_usage_basis` を検出する。
- [ ] 関連 acceptance / cost / evidence / verify checks が pass する。
- [ ] 外部 state を変更せず、未実施外部 action を pending として維持する。

## Done 条件

- [ ] 実装差分が PR branch に commit / push されている。
- [ ] 受け入れ条件確認コメントとセルフレビューコメントを PR に投稿している。
- [ ] task md に PR コメント URL と検証結果を記録し、`tasks/done/` へ移動している。
- [ ] 作業レポートを `reports/working/` に保存している。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run cost:check`
- `npm run acceptance:package:check`
- `npm run evidence:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## PR コメント

- 未投稿。PR push 後に受け入れ条件確認とセルフレビューを記録する。

## PR レビュー観点

- final manifest の cost estimate 前提が AC-140 と local cost checker の前提に一致すること。
- fixture が cost assumption 前提欠落を明確な error label で検出していること。
- 外部 state 変更を伴わず、final acceptance ready を誤って true にしないこと。

## リスク

- final evidence manifest で異なる利用前提を採用する場合、final candidate gate が fail する。ただし AC-140 が 50 DAU / 10 questions/day を明示しているため、fail させるのが妥当。
- 最終検収完了には引き続き外部 action が必要であり、この task 単体では goal 全体は完了しない。
