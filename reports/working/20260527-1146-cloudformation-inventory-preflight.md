# CloudFormation inventory preflight 作業完了レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` をもとに実装する。
- ローカル確認は `.workspace/local.md` を参考にする。
- `.workspace/Saphnexa_検収受入条件_package_v1.0` を満たすまで作業を継続する。
- 完了条件を満たさない項目を完了扱いしない。

## 要件整理

- AC-081 は検収環境の CloudFormation `describe-stacks` / `list-stack-resources` と infra inventory の照合が必要。
- ローカルでは実 AWS stack を取得できないため、最終検収証跡ではなく preflight として draft 生成・検査・手順整備を行う。
- `AC-081` は `requires_aws` のまま残し、AWS 未取得を隠さない。

## 検討・判断

- local CDK intent は既存の `synthLocalInventory("uat")` を使い、7 construct の resources / outputs を draft inventory に集約した。
- `final_acceptance_eligible=false` と `aws_capture_required=true` を機械的に検査し、draft を final AC-081 証跡として誤用できないようにした。
- 最終検収で必要な AWS CLI 読み取りコマンドと正規化先を runbook に明記した。

## 実施作業

- `tools/cloudformation-inventory.js`、`tools/build-cloudformation-inventory.js`、`tools/check-cloudformation-inventory.js` を追加した。
- `docs/acceptance/cloudformation/cloudformation_inventory.schema.json` と `docs/ops/runbooks/cloudformation-inventory.md` を追加した。
- `package.json`、`Taskfile.yml`、CI、admin report、docs check、local verification docs、acceptance trace を同期した。
- `tools/build-acceptance-package.js` と `tools/check-acceptance-package.js` に CloudFormation inventory draft の生成・検査を組み込んだ。

## 成果物

- `dist/acceptance/cloudformation_inventory.draft.json`
- `docs/acceptance/cloudformation/cloudformation_inventory.schema.json`
- `docs/ops/runbooks/cloudformation-inventory.md`
- `npm run cfn:inventory:build`
- `npm run cfn:inventory:check`
- PR 受け入れ条件コメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550793989
- PR セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550793990
- PR task 完了セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550799097
- GitHub Actions run: https://github.com/tsuji-tomonori/saphnexa/actions/runs/26487727209

## 検証

- `npm run cfn:inventory:build`: pass
- `npm run cfn:inventory:check`: pass
- `npm run acceptance:package:build`: pass
- `npm run acceptance:package:check`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `npm run acceptance:check`: pass
- `npm run admin-artifacts:build`: pass
- `npm run artifacts:check`: pass
- `npm run verify`: pass
- PR #1 GitHub Actions `Saphnexa CI` 14 jobs: pass

## fit 評価

- 総合fit: 4.2 / 5.0
- 理由: AC-081 の最終証跡取得に必要な draft/schema/check/runbook は整備したが、実 AWS CloudFormation inventory は未取得のため、検収条件そのものはまだ未達。

## 未対応・制約・リスク

- AWS deploy、CloudFormation `describe-stacks`、CloudFormation `list-stack-resources` は未実施。
- Git tag/release、CloudFormation stack id、公開 docs/Allure URL、最終署名 checklist は未実施。
- 検収 trace の `requires_aws` は AC-001、AC-002、AC-004、AC-081、AC-150、AC-151、AC-152 が残る。
