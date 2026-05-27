# final artifact public url gate

- 状態: in_progress
- タスク種別: 機能追加
- 対象PR: #1

## 背景

Saphnexa の final acceptance では、CloudFront/S3/Docusaurus/Allure の published URL が最終証跡として必要である。現在の final candidate validator は `https://` または `s3://` の URL と設計 prefix を確認しているが、`https://localhost/...`、private IP、`.internal` などのローカル/内部 URL を final published artifact として reject する明示検査が不足している。

## 目的

final evidence manifest と final checklist の証跡 URL が、ローカル開発 URL や内部専用 URL のまま final ready になることを防ぐ。

## スコープ

- `tools/final-evidence-candidate.js`
- `tools/check-final-evidence-candidate-fixtures.js`
- 必要に応じた evidence manifest schema description / check
- 作業レポート

## 対象外

- AWS への deploy / publish
- GitHub release 作成
- CloudFormation capture
- final checklist 署名

## 計画

1. `isArtifactUrl` に public HTTPS host 検査を追加する。
2. S3 URL は既存通り final artifact URL として許可する。
3. localhost/private/internal URL の negative fixture を追加する。
4. evidence manifest schema description を必要最小限で同期する。
5. acceptance と repository 検証を実行する。
6. レポート、commit、push、PR コメントを行う。

## ドキュメントメンテナンス方針

schema pattern を複雑化しすぎず、description に「localhost/internal/private host は final evidence ではない」ことを追記する。validator の実検査を正本にする。

## 受け入れ条件

- [ ] final candidate validator が `https://localhost`、loopback/private IP、`.internal`、`.local`、`.test` の artifact URL を reject する。
- [ ] S3 artifact URL と public HTTPS artifact URL は引き続き許可される。
- [ ] docs / Allure / RAG evaluation / checklist evidence URL の negative fixture が invalid になる。
- [ ] evidence manifest schema の説明が validator と矛盾しない。
- [ ] `npm run acceptance:package:check` と `npm run verify` が pass する。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run evidence:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## PRレビュー観点

- published URL の final evidence として localhost/internal/private host を許していないこと。
- S3 origin prefix の final evidence は従来通り許可していること。
- AWS 実行済みや final acceptance 完了を誤って主張していないこと。

## リスク

- 検収環境で一時的に private DNS を証跡 URL として使う運用がある場合、この gate により reject される。ただし AC-002 の published URL 証跡としては public CloudFront または S3 artifact URL を使うべきである。
- 外部作業が必要な final acceptance 残件はこのタスクでは解消しない。
