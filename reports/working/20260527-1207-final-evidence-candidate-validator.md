# final evidence candidate validator 作業完了レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` をもとに実装する。
- ローカル確認は `.workspace/local.md` を参考にする。
- `.workspace/Saphnexa_検収受入条件_package_v1.0` を満たすまで作業を継続する。
- 完了条件を満たさない項目を完了扱いしない。

## 要件整理

- 最終検収には final `evidence_manifest.json`、final acceptance checklist、CloudFormation 実 inventory が必要。
- 現在は final candidate が未配置であり、draft を final として通してはいけない。
- 候補ファイルがない状態は local preflight として `not_ready` で pass し、候補ファイルが置かれた場合は placeholder/draft を fail させる。

## 検討・判断

- final candidate の状態を `dist/acceptance/final_candidate_status.json` に出力し、readiness gate と acceptance package に組み込んだ。
- manifest には `github_release_url`、実 AWS account、実 CloudFormation stack ARN、公開 artifact URL を求めるようにした。
- checklist は全 AC 行が `PASS`、`evidence_link`、`reviewer`、`checked_date` を持つことを求めるようにした。

## 実施作業

- `tools/final-evidence-candidate.js` と `tools/check-final-evidence-candidate.js` を追加した。
- `tools/final-acceptance-readiness.js`、`tools/check-final-acceptance-readiness.js`、`tools/build-acceptance-package.js`、`tools/check-acceptance-package.js` に final candidate status を組み込んだ。
- `package.json`、Taskfile、CI、admin report、docs check、local verification docs、acceptance trace を同期した。
- `docs/ops/runbooks/final-acceptance.md` を追加した。

## 成果物

- `dist/acceptance/final_candidate_status.json`
- `npm run acceptance:final-candidate:check`
- `docs/ops/runbooks/final-acceptance.md`

## 検証

- `npm run acceptance:final-candidate:check`: pass (`not_ready` として final candidate 未配置を明示)
- `npm run acceptance:final:build`: pass
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:build`: pass
- `npm run acceptance:package:check`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `npm run acceptance:check`: pass
- `npm run admin-artifacts:build`: pass
- `npm run artifacts:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files .github/workflows/ci.yml Taskfile.yml docs/acceptance/traceability.md docs/ops/local-verification.md package.json tools/build-acceptance-package.js tools/build-admin-test-report.js tools/check-acceptance-package.js tools/check-ci-workflow.js tools/check-docs.js tools/check-final-acceptance-readiness.js tools/final-acceptance-readiness.js docs/ops/runbooks/final-acceptance.md tasks/do/20260527-1202-final-evidence-candidate-validator.md tools/check-final-evidence-candidate.js tools/final-evidence-candidate.js`: pass

## fit 評価

- 総合fit: 4.0 / 5.0
- 理由: final candidate の受け皿と validator は追加したが、実 GitHub release/AWS/publish/checklist 証跡は未配置のため、検収完了条件そのものは未達。

## 未対応・制約・リスク

- `docs/acceptance/final/evidence_manifest.json`、`docs/acceptance/final/acceptance_checklist.csv`、`docs/acceptance/cloudformation/cloudformation_inventory.uat.json` は未配置。
- Git tag/release、AWS deploy/publish、CloudFormation 実 inventory、最終署名 checklist は未実施。
- 検収 trace の `requires_aws` は AC-001、AC-002、AC-004、AC-081、AC-150、AC-151、AC-152 が残る。
