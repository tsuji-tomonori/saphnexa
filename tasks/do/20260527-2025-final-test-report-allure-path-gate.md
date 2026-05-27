# final test report allure path gate

状態: doing

## 背景

基本設計書 v0.16 は Allure を CI が生成する静的 HTML レポートとして扱い、管理者は CloudFront 配下の `/admin/test-reports/allure/latest/` または `/admin/test-reports/allure/runs/{test_run_id}/` で閲覧する。S3 origin prefix は `test-reports/allure/latest/` と `test-reports/allure/runs/{test_run_id}/` である。

現状の final evidence candidate verifier は `allure_latest_url` の latest path だけを検査し、`unit_report_url`、`integration_report_url`、`e2e_report_url` が Allure static report path かどうかは検査していない。さらに evidence manifest example は `test-reports/unit/latest/`、`test-reports/integration/latest/`、`test-reports/e2e/latest/` という設計書にない prefix を例示している。

## 目的

最終 evidence manifest の `test_reports` URL が、基本設計書 v0.16 の Allure static report path に沿うことを final candidate gate と schema/example check で検出できるようにする。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の PR branch で、final evidence candidate verifier と evidence manifest example は test report URL 全体を設計書 4.3.3 / 8.4.2 の Allure static report path と完全には照合していない。

### 確認済み事実

- 基本設計書 4.3.3 は `/admin/test-reports/allure/latest/` と `/admin/test-reports/allure/runs/{test_run_id}/` を viewer path として定義している。
- 基本設計書 8.4.2 は S3 prefix `test-reports/allure/latest/{allure_assets}` と `test-reports/allure/runs/{test_run_id}/{allure_assets}` を定義している。
- `tools/final-evidence-candidate.js` は `allure_latest_url` だけを `/test-reports/allure/latest/` suffix で検査している。
- `unit_report_url`、`integration_report_url`、`e2e_report_url` は final http(s) / s3 URL であれば通る。
- `docs/acceptance/evidence/evidence_manifest.example.json` は `test-reports/unit/latest/`、`test-reports/integration/latest/`、`test-reports/e2e/latest/` を例示している。

### 推定原因

- source schema の `test_reports` は汎用 string 型で、local draft package も `dist/admin/test-reports/allure/latest/` を使うため、final manifest 用の Allure path 制約が schema/example 側に十分反映されていなかった。

### 根本原因

- final candidate fixture に `unit_report_url`、`integration_report_url`、`e2e_report_url` が非 Allure path でも通ってしまうケースがなく、Allure static report path 契約を回帰検査できていなかった。

### 影響範囲

- final evidence manifest の test report 証跡が、設計書外の `test-reports/unit/latest/` などでも通過し得る。
- API/UI/RAG 実行経路や認可境界は変更対象外。

### 対策

- final candidate verifier で `test_reports` 全 URL を Allure latest または run path として検査する。
- 非 Allure path fixture を追加し、明確な error label で検出する。
- evidence manifest schema/example/checker を Allure path に同期する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - `docs/acceptance/evidence/evidence_manifest.schema.json`
  - `docs/acceptance/evidence/evidence_manifest.example.json`
  - `tools/check-evidence-manifest.js`
  - 作業レポート
- 対象外:
  - Allure CLI 実行
  - Git tag / GitHub release 作成
  - AWS deploy / publish 実行
  - CloudFormation 実環境 capture
  - final checklist signoff

## 実装計画

1. final candidate verifier に Allure report path helper を追加する。
2. `unit_report_url`、`integration_report_url`、`e2e_report_url` の非 Allure path fixture を追加する。
3. evidence manifest schema/example/checker を Allure latest / run path に同期する。
4. 関連 check と `npm run verify` を実行する。
5. 作業レポート、commit、push、PR コメント、task done 更新まで進める。

## ドキュメント保守計画

- 設計書自体は `.workspace` 配下の入力資料であり変更しない。
- evidence manifest schema/example は最終 evidence 提出形式に影響するため同一 scope で更新する。
- 作業結果と未実施外部 action は作業レポートと PR コメントに記録する。

## 受け入れ条件

- [ ] final candidate verifier が `allure_latest_url` を Allure latest path として検査する。
- [ ] final candidate verifier が `unit_report_url`、`integration_report_url`、`e2e_report_url` を Allure latest または run path として検査する。
- [ ] 非 Allure test report path fixture が final candidate gate で reject される。
- [ ] evidence manifest example/schema/checker が設計書準拠 Allure path と同期している。
- [ ] 関連 acceptance / evidence / package / verify checks が pass する。
- [ ] 外部 state を変更せず、未実施外部 action を pending として維持する。

## Done 条件

- [ ] 実装差分が PR branch に commit / push されている。
- [ ] 受け入れ条件確認コメントとセルフレビューコメントを PR に投稿している。
- [ ] task md に PR コメント URL と検証結果を記録し、`tasks/done/` へ移動している。
- [ ] 作業レポートを `reports/working/` に保存している。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run evidence:check`
- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## PR コメント

- 未投稿。PR push 後に受け入れ条件確認とセルフレビューを記録する。

## PR レビュー観点

- final evidence manifest の test report URL が基本設計書の Allure static report path 契約に合うこと。
- latest と run path の両方を許容しつつ、`test-reports/unit/latest/` など設計外 prefix を通さないこと。
- RAG、認可境界、benchmark 固有値へ影響しないこと。

## リスク

- 既存の `test-reports/unit/latest/`、`test-reports/integration/latest/`、`test-reports/e2e/latest/` を使った final manifest 候補は reject される。ただし基本設計書は Allure static report path を定義しているため、reject が妥当。
- 最終検収完了には引き続き外部 action が必要であり、この task 単体では goal 全体は完了しない。
