# final allure report url gate

状態: done

## 背景

検収完了条件は Allure レポート URL を証跡マニフェストに記録することを求めている。repository では admin test report artifact が `dist/admin/test-reports/allure/latest/` と `/admin/test-reports/allure/latest/` を扱っているが、final evidence candidate verifier は `test_reports.allure_latest_url` が http(s) または s3 URL であることのみ検査している。

## 目的

最終 `evidence_manifest.json` の `test_reports.allure_latest_url` が Allure latest report path を指すことを final candidate gate で検出する。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の PR branch で、final evidence candidate verifier は `test_reports.allure_latest_url` が任意の artifact URL であることは検査するが、Allure latest report URL であることを検査していない。

### 確認済み事実

- `tools/build-admin-test-report.js` は `dist/admin/test-reports/allure/latest/` に report artifact を生成する。
- `tools/check-admin-artifacts.js` は `/admin/test-reports/allure/latest/` を検査している。
- `docs/acceptance/traceability.md` の AC-021 / AC-088 は `dist/admin/test-reports/allure/latest/` を証跡としている。
- `tools/final-evidence-candidate.js` は test report URL の artifact URL 形式だけを検査している。

### 推定原因

- Allure artifact の構造検査と final evidence manifest の URL 検査が別実装で、final manifest に Allure latest URL の具体条件が同期されていなかった。

### 根本原因

- final candidate fixture に Allure latest URL の取り違えを検出するケースがなかった。

### 影響範囲

- final evidence manifest の診断精度。Allure 以外の test report URL が `allure_latest_url` に記録されても final candidate gate が通過し得る。
- 本修正は acceptance verifier のみで、API/UI/RAG 実行経路や認可境界は変更しない。

### 対策

- final candidate verifier で `test_reports.allure_latest_url` が `/test-reports/allure/latest/` 相当で終わることを検査する。
- 誤った Allure latest URL fixture を追加する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - 作業レポート
- 対象外:
  - Allure artifact 生成内容の変更
  - Git tag / GitHub release 作成
  - AWS deploy / publish
  - CloudFormation 実環境 capture
  - final checklist signoff

## 実装計画

1. final candidate verifier に Allure latest URL suffix check を追加する。
2. ready fixture の `allure_latest_url` を Allure latest path に合わせる。
3. 誤った Allure URL fixture を追加する。
4. 関連 acceptance checks と `npm run verify` を実行する。
5. 作業レポートを `reports/working/` に保存する。
6. commit / push 後、PR に受け入れ条件確認とセルフレビューを投稿する。

## ドキュメント保守計画

- 既存 trace / admin artifact check は Allure latest path を明示済みのため、追加 docs 更新は不要見込み。
- 作業結果と未実施外部 action は作業レポートと PR コメントに記録する。

## 受け入れ条件

- [x] final candidate verifier が `test_reports.allure_latest_url` の Allure latest path を検査する。
- [x] 誤った Allure latest URL fixture が `manifest.test_reports.allure_latest_url_latest_path` を検出する。
- [x] 関連 acceptance / artifacts / evidence / verify checks が pass する。
- [x] 外部 state を変更せず、未実施外部 action を pending として維持する。

## Done 条件

- [x] 実装差分が PR branch に commit / push されている。
- [x] 受け入れ条件確認コメントとセルフレビューコメントを PR に投稿している。
- [x] task md に PR コメント URL と検証結果を記録し、`tasks/done/` へ移動している。
- [x] 作業レポートを `reports/working/` に保存している。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run artifacts:check`
- `npm run acceptance:package:check`
- `npm run evidence:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553924257
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553926971
- GitHub Apps comment は既知の 403 `Resource not accessible by integration` のため、`gh pr comment` fallback で投稿した。

## 検証結果

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass。final files 未配置のため `not ready` 表示、errors なし。
- `npm run artifacts:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run evidence:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files tools/final-evidence-candidate.js tools/check-final-evidence-candidate-fixtures.js tasks/do/20260527-1958-final-allure-report-url-gate.md reports/working/20260527-2000-final-allure-report-url-gate.md`: pass

## PR レビュー観点

- final manifest の Allure URL が admin test report artifact の latest path と一致すること。
- fixture が Allure URL 誤りを明確な error label で検出していること。
- 外部 state 変更を伴わず、final acceptance ready を誤って true にしないこと。

## リスク

- final evidence manifest で Allure latest 以外の URL を `allure_latest_url` に記録していた場合、final candidate gate が fail する。ただし検収完了条件が Allure レポート URL を要求しているため、fail させるのが妥当。
- 最終検収完了には引き続き外部 action が必要であり、この task 単体では goal 全体は完了しない。
