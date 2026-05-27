# final docs artifact prefix gate

状態: doing

## 背景

基本設計書 v0.16 の 4.3.3 は、管理者向け Docusaurus docs の viewer path と内部 S3 prefix を次のように定義している。

- latest viewer path: `/admin/docs/latest/`
- latest S3 prefix: `s3://{admin-artifacts-bucket}/docs-site/latest/`
- version viewer path: `/admin/docs/versions/{version}/`
- version S3 prefix: `s3://{admin-artifacts-bucket}/docs-site/releases/{version}/`

一方、現状の final evidence candidate verifier は `docs_site.latest_url` が `/latest/`、`docs_site.version_url` が `/versions/v0.16/` で終わることだけを検査しており、設計書の admin docs viewer path / S3 prefix との一致を検査していない。さらに external action plan の docs publish command は `dist/admin/docs/` を `s3://<admin-artifacts-bucket>/docs/` へ同期する形で、設計書の `docs-site/*` prefix とずれている。

## 目的

最終 evidence manifest と外部 action plan が、基本設計書 v0.16 の admin docs artifact path に沿うことを local gate で検出できるようにする。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の PR branch で、final evidence candidate verifier と external action plan は Docusaurus docs artifact の final URL / publish prefix を設計書 4.3.3 の admin docs path と完全には照合していない。

### 確認済み事実

- 基本設計書 4.3.3 は `/admin/docs/latest/` と `/admin/docs/versions/{version}/` を viewer path として定義している。
- 同じ表は S3 prefix として `docs-site/latest/` と `docs-site/releases/{version}/` を定義している。
- `tools/final-evidence-candidate.js` は `docs_site.latest_url` を `/latest/` suffix、`docs_site.version_url` を `/versions/v0.16/` suffix だけで検査している。
- `tools/external-acceptance-actions.js` は docs publish command を `s3://<admin-artifacts-bucket>/docs/` としている。
- local admin docs artifact は viewer path `/admin/docs/latest/` と `/admin/docs/versions/v0.16/` を manifest に持つ。

### 推定原因

- local build output path `dist/admin/docs/latest/` と viewer path `/admin/docs/latest/`、S3 origin prefix `docs-site/latest/` が別概念だが、final evidence gate では単純な suffix check に寄せられていた。

### 根本原因

- final evidence candidate fixture に「docs URL が `/latest/` だけは満たすが admin docs viewer/S3 prefix と一致しない」ケースがなく、設計書 4.3.3 の path 契約を回帰検査できていなかった。

### 影響範囲

- final evidence manifest の docs_site URL が、設計外の `docs/latest/` や任意の `/latest/` path でも通過し得る。
- 外部 publish 手順が `docs-site/*` ではない prefix を候補として提示し得る。
- API/UI/RAG 実行経路や認可境界は変更対象外。

### 対策

- final candidate verifier で docs latest/version URL を、CloudFront viewer path または設計書準拠 S3 prefix として検査する。
- 不正 docs prefix fixture を追加し、明確な error label で検出する。
- external action plan の docs publish command と checker を `docs-site/latest/` / `docs-site/releases/v0.16/` に合わせる。
- evidence manifest schema/example も設計書準拠 prefix へ寄せ、`npm run evidence:check` で固定する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - `tools/external-acceptance-actions.js`
  - `tools/check-external-acceptance-actions.js`
  - `docs/acceptance/evidence/evidence_manifest.schema.json`
  - `docs/acceptance/evidence/evidence_manifest.example.json`
  - `tools/check-evidence-manifest.js`
  - 作業レポート
- 対象外:
  - Git tag / GitHub release 作成
  - AWS deploy / publish 実行
  - CloudFormation 実環境 capture
  - final checklist signoff

## 実装計画

1. final docs URL 判定 helper を追加し、latest/version の label を設計書準拠 path の検査に置き換える。
2. invalid fixture を追加し、`docs/latest` や `docs/versions/v0.16` が通らないことを確認する。
3. external action plan の docs publish command と checker を更新する。
4. evidence manifest example/schema/checker を docs-site prefix に同期する。
5. 関連 check と `npm run verify` を実行する。
6. 作業レポート、commit、push、PR コメント、task done 更新まで進める。

## ドキュメント保守計画

- 設計書自体は `.workspace` 配下の入力資料であり変更しない。
- evidence manifest schema/example は final evidence の提出形式に影響するため同一 scope で更新する。
- 作業結果と未実施外部 action は作業レポートと PR コメントに記録する。

## 受け入れ条件

- [ ] final candidate verifier が `docs_site.latest_url` を `/admin/docs/latest/` または `docs-site/latest/` として検査する。
- [ ] final candidate verifier が `docs_site.version_url` を `/admin/docs/versions/v0.16/` または `docs-site/releases/v0.16/` として検査する。
- [ ] 不正 docs prefix fixture が final candidate gate で reject される。
- [ ] external action plan の docs publish command が `docs-site/latest/` と `docs-site/releases/v0.16/` を提示する。
- [ ] evidence manifest example/schema/checker が設計書準拠 docs-site prefix と同期している。
- [ ] 関連 acceptance / evidence / artifact / verify checks が pass する。
- [ ] 外部 state を変更せず、未実施外部 action を pending として維持する。

## Done 条件

- [ ] 実装差分が PR branch に commit / push されている。
- [ ] 受け入れ条件確認コメントとセルフレビューコメントを PR に投稿している。
- [ ] task md に PR コメント URL と検証結果を記録し、`tasks/done/` へ移動している。
- [ ] 作業レポートを `reports/working/` に保存している。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:external-actions:check`
- `npm run evidence:check`
- `npm run artifacts:check`
- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## PR コメント

- 未投稿。PR push 後に受け入れ条件確認とセルフレビューを記録する。

## PR レビュー観点

- final evidence manifest の docs URL が基本設計書 4.3.3 の admin docs path 契約に合うこと。
- S3 origin prefix と CloudFront viewer path のどちらを証跡 URL として使っても、設計書準拠の path だけが通ること。
- external action plan は外部 state を変更せず、実行候補だけを設計書準拠にすること。
- RAG、認可境界、benchmark 固有値へ影響しないこと。

## リスク

- 既存の `docs/latest/` prefix を使った final manifest 候補は reject される。ただし基本設計書 4.3.3 は `docs-site/latest/` を内部 S3 prefix として定義しているため、reject が妥当。
- 最終検収完了には引き続き外部 action が必要であり、この task 単体では goal 全体は完了しない。
