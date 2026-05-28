# Docusaurus / Allure 公開バインディング実装

状態: done

## 背景

ユーザー依頼の本実装ロードマップ 6「Docusaurus / Allure公開」を進める。既存実装では admin artifacts のローカル HTML と Allure 互換レポートを生成し、CloudFront の admin artifact 経路は存在するが、Docusaurus/Allure の実ツールを前提にした公開 source、S3 prefix、CloudFront viewer path、検査コマンドの結合が不足している。

## 目的

Docusaurus docs site と Allure static report を admin artifacts bucket / CloudFront 配下へ publish するための実装 source と検証 gate を追加し、AWS dev/UAT E2E・性能・RAG品質検証の最終 evidence に接続できる状態へ近づける。

## タスク種別

機能追加

## スコープ

- Docusaurus docs site の package/config/source を追加する。
- Allure report の latest/run/raw results prefix と publish metadata を artifact manifest に含める。
- publish binding source と checker を追加し、外部 acceptance action plan、docs、traceability と同期する。
- 実 AWS publish 自体はこのタスクでは実行せず、pending external action として扱う。

## 実施計画

1. 既存 admin artifacts、CloudFront rewrite、external action、traceability を確認する。
2. Docusaurus/Allure publish binding source と Docusaurus package skeleton を追加する。
3. admin docs/test report manifest と domain store metadata を publish-ready に更新する。
4. publish binding checker と npm/Taskfile/docs check の参照を追加する。
5. admin artifacts build/check、external action check、docs check、関連テストを実行する。
6. 作業レポート、commit/push、PR コメント、task done 移動まで行う。

## ドキュメント保守計画

- `docs/acceptance/traceability.md` に Docusaurus/Allure publish binding の検証状況を反映する。
- `docs/ops/local-verification.md` に新しい検証コマンドを追加する。
- 実 AWS publish は未実施であることを docs/report/PR comment に明記する。

## 受け入れ条件

- [x] Docusaurus docs site の実 package/config/source が repository に存在し、admin docs artifact manifest から追跡できる。
- [x] Allure static report publish の latest/run/raw results prefix、viewer path、publish candidate command が artifact manifest または binding source で追跡できる。
- [x] S3 admin artifacts bucket prefix と CloudFront admin viewer path が checker で検査される。
- [x] `npm run admin-artifacts:build` と `npm run artifacts:check` が pass する。
- [x] Docusaurus/Allure publish binding 専用の検査コマンドが pass する。
- [x] 変更に見合う docs/acceptance/ops の同期と検証結果が作業レポートに残る。
- [x] PR に受け入れ条件確認とセルフレビューコメントを追加できる。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4560171501
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4560173089

## 検証計画

- `npm run admin-artifacts:build`
- `npm run artifacts:check`
- `npm run admin-artifacts:publish:check`
- `npm run acceptance:external-actions:check`
- `npm run web:flow:check`
- `npm run docs:check`
- `npm run test:e2e:local`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `git diff --check`

## PR レビュー観点

- Docusaurus/Allure の実公開に向けた source と manifest がローカル互換 HTML だけに閉じていないこと。
- CloudFront signed cookie / admin-only 経路を弱めていないこと。
- 実施していない AWS publish を完了済みと表現していないこと。
- final evidence が要求する `docs-site/*` と `test-reports/allure/*` prefix から逸れていないこと。

## リスク

- 実 AWS deploy / S3 sync / CloudFront 200/403/302 確認は外部状態を変更するため、このタスクでは未実施となる。
- Docusaurus/Allure CLI の dependency install や実 build は環境依存があるため、まず source/binding/check の追加で publish readiness を高める。
