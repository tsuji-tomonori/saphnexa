# acceptance package draft 作業完了レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/local.md` に沿って、`.workspace/Saphnexa_検収受入条件_package_v1.0` の充足に向けて実装・検証を継続する。
- 完了条件を満たさない項目を完了扱いしない。

## 要件整理

- 最終検収の提出物に近い draft package を `dist/acceptance/` に生成する。
- Git tag、GitHub release、AWS account、CloudFormation stack、公開 URL は未実施であることを明示する。
- GitHub issue tracker の snapshot を defect list として保存し、Blocker/Critical open defect 0 を検査する。
- `package.json`、Taskfile、CI、admin report、docs/trace を同期する。

## 検討・判断

- `evidence_manifest.draft.json` は final manifest ではなく draft として `draft_not_for_final_acceptance` を明記した。
- AWS account id は数値風 placeholder を避け、`pending-aws-account-id` とした。pre-commit の secret scan と「未確定値を実値に見せない」方針の両方に合わせるため。
- `AC-153` は 2026-05-27 11:25 JST 時点の `gh issue list --state open --json number,title,labels,state` 結果が空であることを snapshot 化し、`local_verified` に更新した。最終検収時の再取得は必要。

## 実施作業

- `tools/build-acceptance-package.js` を追加し、draft evidence manifest、draft checklist、defect list、summary を生成するようにした。
- `tools/check-acceptance-package.js` を追加し、全 AC 行、空欄なし、`requires_aws` の pending 維持、Blocker/Critical defect 0、final acceptance ready を false とすることを検査した。
- `docs/acceptance/defects/open_issues_snapshot.json` を追加した。
- `package.json`、`Taskfile.yml`、`.github/workflows/ci.yml`、`tools/check-ci-workflow.js`、`tools/build-admin-test-report.js`、`tools/check-docs.js`、`docs/ops/local-verification.md`、`docs/acceptance/traceability.md` を同期した。

## 成果物

- `dist/acceptance/evidence_manifest.draft.json`
- `dist/acceptance/acceptance_checklist.draft.csv`
- `dist/acceptance/defect_list.json`
- `dist/acceptance/summary.json`
- `docs/acceptance/defects/open_issues_snapshot.json`

## 検証

- `npm run acceptance:package:build`: pass
- `npm run acceptance:package:check`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `npm run evidence:check`: pass
- `npm run acceptance:check`: pass
- `npm run admin-artifacts:build`: pass
- `npm run artifacts:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files .github/workflows/ci.yml Taskfile.yml docs/acceptance/traceability.md docs/ops/local-verification.md package.json tools/build-admin-test-report.js tools/check-ci-workflow.js tools/check-docs.js docs/acceptance/defects/open_issues_snapshot.json tasks/do/20260527-1125-acceptance-package-draft.md tools/build-acceptance-package.js tools/check-acceptance-package.js`: pass

## fit 評価

- draft package の生成・検査は満たした。
- `requires_aws` 行を `PASS` 扱いしない検査を追加し、未実施 AWS/release 項目を隠していない。
- `AC-153` は issue tracker snapshot と defect list check でローカル検証済みとして扱える。

## 未対応・制約・リスク

- Git tag、GitHub release、AWS deploy、CloudFormation inventory、CloudFront/S3/Docusaurus/Allure publish、最終署名 checklist は未実施。
- trace 上の残件は `AC-001`、`AC-002`、`AC-004`、`AC-081`、`AC-150`、`AC-151`、`AC-152` の `requires_aws`。
- draft summary の commit SHA は生成時点の HEAD を反映する。CI または再生成時にはその時点の commit SHA に更新される。
