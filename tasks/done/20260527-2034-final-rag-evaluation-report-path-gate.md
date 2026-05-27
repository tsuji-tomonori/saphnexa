# final rag evaluation report path gate

状態: done

## 背景

基本設計書 v0.16 は RAG 評価成果物について、Evaluation artifacts bucket の run root `tenants/{tenant_id}/evaluation-runs/{evaluation_run_id}/` と、管理者向け評価 HTML レポート `reports/evaluations/{evaluation_run_id}/` / `/admin/evaluation-reports/{evaluation_run_id}/` を定義している。

現状の final evidence candidate verifier は `rag_evaluation.report_url` が final http(s) / s3 URL であることだけを検査している。ready fixture は `s3://saphnexa-acceptance-artifacts/rag/eval-20260527-uat-final.json`、example manifest は `s3://example-evaluation-artifacts/reports/example/` を使っており、評価 HTML レポート path と `evaluation_run_id` の一致までは検査していない。

## 目的

最終 evidence manifest の `rag_evaluation.report_url` が、基本設計書 v0.16 の評価レポート path に沿い、`evaluation_run_id` と紐づくことを final candidate gate と schema/example check で検出できるようにする。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の PR branch で、final evidence candidate verifier と evidence manifest example は RAG evaluation report URL を設計書 8.4.2 の評価 HTML レポート path と照合していない。

### 確認済み事実

- 基本設計書 4.3.3 は `/admin/evaluation-reports/*` を SPA fallback 対象外の管理者向け静的成果物 path として定義している。
- 基本設計書 8.4.2 は評価 HTML レポート S3 prefix `reports/evaluations/{evaluation_run_id}/{html_assets}` と viewer path `/admin/evaluation-reports/{evaluation_run_id}/{html_assets}` を定義している。
- `tools/final-evidence-candidate.js` は `rag_evaluation.report_url` が final artifact URL であることのみを検査している。
- `tools/check-final-evidence-candidate-fixtures.js` の ready fixture は `rag/eval-20260527-uat-final.json` を report URL にしている。
- `docs/acceptance/evidence/evidence_manifest.example.json` は `reports/example/` を report URL にしている。

### 推定原因

- source schema の `rag_evaluation.report_url` は汎用 string 型で、final manifest 用の評価 HTML レポート path 制約が schema/example と final candidate verifier に反映されていなかった。

### 根本原因

- final candidate fixture に `evaluation_run_id` と無関係な report URL が通ってしまうケースがなく、評価レポート path と run id の紐づきを回帰検査できていなかった。

### 影響範囲

- final evidence manifest の RAG 評価証跡が、設計書外の JSON や任意 URL でも通過し得る。
- API/UI/RAG 実行経路や認可境界は変更対象外。

### 対策

- final candidate verifier で `rag_evaluation.report_url` を `/admin/evaluation-reports/{evaluation_run_id}/` または `reports/evaluations/{evaluation_run_id}/` に限定する。
- `evaluation_run_id` と一致しない report URL fixture を追加する。
- evidence manifest schema/example/checker を評価レポート path に同期する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - `docs/acceptance/evidence/evidence_manifest.schema.json`
  - `docs/acceptance/evidence/evidence_manifest.example.json`
  - `tools/check-evidence-manifest.js`
  - 作業レポート
- 対象外:
  - RAG 評価の実行
  - 評価 HTML レポート生成
  - Git tag / GitHub release 作成
  - AWS deploy / publish 実行
  - CloudFormation 実環境 capture
  - final checklist signoff

## 実装計画

1. final candidate verifier に evaluation report path helper を追加する。
2. `evaluation_run_id` と一致しない report URL fixture を追加する。
3. evidence manifest schema/example/checker を評価レポート path に同期する。
4. 関連 check と `npm run verify` を実行する。
5. 作業レポート、commit、push、PR コメント、task done 更新まで進める。

## ドキュメント保守計画

- 設計書自体は `.workspace` 配下の入力資料であり変更しない。
- evidence manifest schema/example は最終 evidence 提出形式に影響するため同一 scope で更新する。
- 作業結果と未実施外部 action は作業レポートと PR コメントに記録する。

## 受け入れ条件

- [x] final candidate verifier が `rag_evaluation.report_url` を evaluation report path として検査する。
- [x] final candidate verifier が `rag_evaluation.report_url` と `evaluation_run_id` の一致を検査する。
- [x] 不一致 RAG evaluation report URL fixture が final candidate gate で reject される。
- [x] evidence manifest example/schema/checker が設計書準拠 evaluation report path と同期している。
- [x] 関連 acceptance / evidence / package / verify checks が pass する。
- [x] 外部 state を変更せず、未実施外部 action を pending として維持する。

## Done 条件

- [x] 実装差分が PR branch に commit / push されている。
- [x] 受け入れ条件確認コメントとセルフレビューコメントを PR に投稿している。
- [x] task md に PR コメント URL と検証結果を記録し、`tasks/done/` へ移動している。
- [x] 作業レポートを `reports/working/` に保存している。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run evidence:check`
- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4554170311
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4554172629

## 実装 commit

- `48e23aa` `✅ test: final rag evaluation report path検査を追加`

## 検証結果

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run evidence:check`: pass
- `npm run acceptance:final-candidate:check`: pass。final files 未配置のため `not ready` 表示は継続するが、errors なしで exit 0。
- `npm run acceptance:package:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files docs/acceptance/evidence/evidence_manifest.example.json docs/acceptance/evidence/evidence_manifest.schema.json tools/check-evidence-manifest.js tools/check-final-evidence-candidate-fixtures.js tools/final-evidence-candidate.js tasks/do/20260527-2034-final-rag-evaluation-report-path-gate.md reports/working/20260527-2036-final-rag-evaluation-report-path-gate.md`: pass

## PR レビュー観点

- final evidence manifest の RAG evaluation report URL が基本設計書の評価 HTML レポート path 契約に合うこと。
- `evaluation_run_id` と report URL の run id が一致すること。
- RAG の評価ロジック、認可境界、benchmark 固有値へ影響しないこと。

## リスク

- 既存の `rag/*.json` や `reports/example/` を使った final manifest 候補は reject される。ただし基本設計書は評価 HTML レポート path を定義しているため、reject が妥当。
- 最終検収完了には引き続き外部 action が必要であり、この task 単体では goal 全体は完了しない。
