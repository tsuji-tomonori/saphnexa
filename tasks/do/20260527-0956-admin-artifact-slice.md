# admin docs/report artifact ローカル検収スライス

## 背景

- 検収 trace では AC-020/021/087/088/126 が Docusaurus/Allure/CloudFront 公開未実施のため `requires_aws` のまま残っている。
- 既存 PR には admin artifact の API 契約と fixture 一覧があるが、docs/report artifact を実際に生成し、admin 限定で公開検査するローカル証跡がない。

## 目的

- AWS 実公開は未実施として明確に残しつつ、ローカル生成物と admin 限定公開の invariant を自動検査できるようにする。
- 検収 package のうちローカルで検証可能な docs/report artifact 条件を前進させる。

## スコープ

- docs/runbooks/ADR/traceability から admin docs site artifact を生成する。
- node test/CI/check 結果から Allure 互換の最小ローカル report artifact を生成する。
- artifact manifest と admin access policy を静的/ローカル API で検査する。
- Taskfile/npm scripts/CI workflow/acceptance trace/docs/report を更新する。

## スコープ外

- Docusaurus 実導入、CloudFront/S3 への publish、Allure CLI 実行。
- GitHub Pages や外部 artifact hosting。
- ブラウザ E2E、axe、Lighthouse の本格導入。

## タスク種別

機能追加

## チェックリスト

- [x] docs site artifact 生成 script と manifest を追加する。
- [x] Allure 風 test report artifact 生成 script と manifest を追加する。
- [x] admin artifact access policy 検査 script と API/store metadata を更新する。
- [x] npm scripts、Taskfile、CI workflow、docs check を更新する。
- [x] acceptance trace を実態に合わせて更新する。
- [x] 検証を実行し、作業レポートを作成する。
- [ ] commit/push/PR コメント/セルフレビュー/task done 更新まで完了する。

## Done 条件

- Deliverables:
  - `dist/admin/docs/latest/` と `dist/admin/docs/versions/v0.16/` を生成できる script がある。
  - `dist/admin/test-reports/allure/latest/` を生成できる script がある。
  - artifact manifest と admin access policy を検査する script がある。
  - acceptance trace と作業レポートが更新されている。
- Validations:
  - `npm run admin-artifacts:build` pass
  - `npm run artifacts:check` pass
  - `npm test` pass
  - `npm run verify` pass
  - `git diff --check` pass
  - `pre-commit run --files <changed-files>` pass

## 受け入れ条件

- [x] docs site artifact は runbook、ADR、acceptance trace を含み、latest と v0.16 version path を生成する。
- [x] test report artifact は CI job/test/check の対象を manifest と HTML に含む。
- [x] artifact manifest は admin docs と Allure report の canonical viewer path、source、checksum を持つ。
- [x] local API では admin の artifact 一覧/アクセス cookie 発行が成功し、一般ユーザー/未認証は拒否される。
- [x] `npm run verify` から artifact build/check が実行される。
- [x] CloudFront/S3/Docusaurus/Allure CLI 実公開が未実施であることを trace/report に明記する。

## 検証計画

- `npm run admin-artifacts:build`
- `npm run artifacts:check`
- `npm test`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- `npm run admin-artifacts:build`: pass
- `npm run artifacts:check`: pass
- `npm test`: pass
- `npm run verify`: pass
- `npm run ci:check`: pass
- `git diff --check`: pass
- `pre-commit run --files <changed-files>`: pass

## ドキュメント保守方針

- 恒久的な検収状態は `docs/acceptance/traceability.md` に反映する。
- artifact の生成・検査手順は `docs/ops/local-verification.md` に追記する。
- 実 AWS 公開や GitHub Actions artifact upload を未実施のまま PASS と書かない。

## PR レビュー観点

- admin artifact を一般ユーザーや未認証ユーザーが参照できる設計にしていないこと。
- 生成 report が固定 PASS を装うだけでなく、実行対象の check 名と source を明示していること。
- docs と trace の状態表現が実装・検証範囲とずれていないこと。

## リスク

- ローカル static artifact と access policy 検査は、CloudFront/S3/Cognito Cookie の実挙動を証明しないため、AWS dev/UAT での公開証跡は後続で必要。

## 状態

doing
