# final docs site version url gate

状態: doing

## 背景

検収完了条件は、Docusaurus 設計書版を証跡マニフェストに記録することを求めている。repository では admin docs artifact と trace が `dist/admin/docs/latest/` と `dist/admin/docs/versions/v0.16/` を扱っているが、final evidence candidate verifier は `docs_site.latest_url` と `docs_site.version_url` が http(s) または s3 URL であることのみ検査している。

## 目的

最終 `evidence_manifest.json` の `docs_site.latest_url` が latest docs を、`docs_site.version_url` が基本設計 v0.16 の versioned docs を指すことを final candidate gate で検出する。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の PR branch で、final evidence candidate verifier は `docs_site.version_url` が任意の artifact URL であることは検査するが、基本設計 v0.16 の versioned docs URL であることを検査していない。

### 確認済み事実

- `tools/build-admin-docs.js` は docs artifact の version を `v0.16` として生成する。
- `tools/check-admin-artifacts.js` は `/admin/docs/versions/v0.16/` を検査している。
- `docs/acceptance/traceability.md` の AC-087 は `dist/admin/docs/latest/` と `dist/admin/docs/versions/v0.16/` を証跡としている。
- `tools/final-evidence-candidate.js` は docs URL の artifact URL 形式だけを検査している。

### 推定原因

- Docusaurus artifact の構造検査と final evidence manifest の URL 検査が別実装で、final manifest に設計書版 URL の具体条件が同期されていなかった。

### 根本原因

- final candidate fixture に docs latest/version URL の取り違えや誤った version URL を検出するケースがなかった。

### 影響範囲

- final evidence manifest の診断精度。設計書版と無関係な docs URL が記録されても final candidate gate が通過し得る。
- 本修正は acceptance verifier のみで、API/UI/RAG 実行経路や認可境界は変更しない。

### 対策

- final candidate verifier で `docs_site.latest_url` が `/latest/` 相当で終わることを検査する。
- `docs_site.version_url` が `/versions/v0.16/` 相当で終わることを検査する。
- 誤った docs version URL fixture を追加する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - 作業レポート
- 対象外:
  - docs artifact の生成内容変更
  - Git tag / GitHub release 作成
  - AWS deploy / publish
  - CloudFormation 実環境 capture
  - final checklist signoff

## 実装計画

1. final candidate verifier に docs latest/version URL suffix check を追加する。
2. ready fixture の docs URL を repository の versioned docs 構造に合わせる。
3. 誤った docs URL fixture を追加する。
4. 関連 acceptance checks と `npm run verify` を実行する。
5. 作業レポートを `reports/working/` に保存する。
6. commit / push 後、PR に受け入れ条件確認とセルフレビューを投稿する。

## ドキュメント保守計画

- 既存 trace / admin artifact check は `v0.16` を明示済みのため、追加 docs 更新は不要見込み。
- 作業結果と未実施外部 action は作業レポートと PR コメントに記録する。

## 受け入れ条件

- [ ] final candidate verifier が `docs_site.latest_url` の latest path を検査する。
- [ ] final candidate verifier が `docs_site.version_url` の `versions/v0.16` path を検査する。
- [ ] 誤った docs URL fixture が `manifest.docs_site.version_url_design_version` を検出する。
- [ ] 関連 acceptance / docs / evidence / verify checks が pass する。
- [ ] 外部 state を変更せず、未実施外部 action を pending として維持する。

## Done 条件

- [ ] 実装差分が PR branch に commit / push されている。
- [ ] 受け入れ条件確認コメントとセルフレビューコメントを PR に投稿している。
- [ ] task md に PR コメント URL と検証結果を記録し、`tasks/done/` へ移動している。
- [ ] 作業レポートを `reports/working/` に保存している。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run docs:check`
- `npm run artifacts:check`
- `npm run acceptance:package:check`
- `npm run evidence:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## PR コメント

- 未投稿。PR push 後に受け入れ条件確認とセルフレビューを記録する。

## PR レビュー観点

- final manifest の docs URLs が admin docs artifact と trace の `v0.16` 構造と一致すること。
- fixture が docs version URL 誤りを明確な error label で検出していること。
- 外部 state 変更を伴わず、final acceptance ready を誤って true にしないこと。

## リスク

- final evidence manifest で `versions/v0.16/` 以外の versioned docs URL を使う運用がある場合、final candidate gate が fail する。ただし対象基本設計が `Saphnexa_基本設計書_v0.16.md` であるため、fail させるのが妥当。
- 最終検収完了には引き続き外部 action が必要であり、この task 単体では goal 全体は完了しない。
