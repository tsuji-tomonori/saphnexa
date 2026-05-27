# admin docs/report artifact ローカル検収スライス 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md`、`.workspace/local.md`、`.workspace/Saphnexa_検収受入条件_package_v1.0` に沿って、検収条件を満たすまで実装と検証を継続する。
- リポジトリルールに従い、task md、検証、PR コメント、作業レポートを残す。

## 要件整理

- docs/Allure/admin artifact 系 AC は AWS 公開が未実施だが、ローカルで検査できる生成物・manifest・admin access policy は自動化できる。
- 実施していない CloudFront/S3/Docusaurus/Allure CLI の公開を PASS と書かない。

## 検討・判断

- Docusaurus/Allure CLI の実導入ではなく、dependency-free な local static artifact generator を先に追加した。
- `dist/` は生成物として `.gitignore` のまま維持し、source と検査 script を commit 対象にした。
- CloudFront Cookie 実挙動は未検証のため、AC-020/021/087/088/126 は `implemented_unverified` とし、AC-143 は runbook artifact 収録を local verified とした。

## 実施作業

- `tools/build-admin-docs.js` で runbooks/ADR/trace/local verification から `dist/admin/docs/latest/` と `dist/admin/docs/versions/v0.16/` を生成する処理を追加。
- `tools/build-admin-test-report.js` で package scripts と CI workflow から Allure 互換 local report を生成する処理を追加。
- `tools/check-admin-artifacts.js` で manifest checksum/source/viewer path と local API admin 限定 access policy を検査。
- admin artifact API fixture に docs v0.16 artifact を追加し、status/source_ref/checksum 表現を local artifact 向けに更新。
- CI workflow、Taskfile、npm scripts、docs check、local verification docs、acceptance trace を更新。

## 成果物

- `npm run admin-artifacts:build`
- `npm run artifacts:check`
- `dist/admin/docs/latest/`、`dist/admin/docs/versions/v0.16/`、`dist/admin/test-reports/allure/latest/` の生成処理
- `docs/acceptance/traceability.md` の AC-020/021/087/088/120/126/143 更新

## 指示への fit 評価

- task md を `tasks/do/` に置き、受け入れ条件と Done 条件を先に明記した。
- ローカルで実施した検証のみを検証済みとして trace/report に反映した。
- CloudFront/S3/Docusaurus/Allure CLI 実公開は未実施として明記した。

## 検証

- `npm run admin-artifacts:build`: pass
- `npm run artifacts:check`: pass
- `npm test`: pass
- `npm run verify`: pass
- `npm run ci:check`: pass
- `git diff --check`: pass
- PR #1 GitHub Actions `Saphnexa CI`: pass（admin artifacts job を含む 11 jobs）

## 未対応・制約・リスク

- Docusaurus build/publish、Allure CLI generate/publish、CloudFront/S3 公開 URL、Cognito/CloudFront Cookie 実挙動は未実施。
- ブラウザ E2E、axe、Lighthouse はこのスライスでは未対応。
