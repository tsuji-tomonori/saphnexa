# final acceptance real-ready transition gate

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/Saphnexa_検収受入条件_package_v1.0` に基づき、検収 package が満たされるまでローカルで可能な作業を継続する。
- 外部 state を変更する GitHub release / AWS deploy / CloudFormation capture / final signoff は明示確認なしに実行しない。

## 要件整理

- final evidence candidate 作成後に `npm run acceptance:final:check` / `npm run acceptance:package:check` が実証跡 ready path を検査できる必要がある。
- 現在の local preflight では、外部 action と final evidence 未作成を pending として維持する必要がある。
- defect snapshot は最終検収時点の再取得が必要であり、古い local snapshot だけで ready にしてはいけない。

## 検討・判断

- `final_readiness.json` は source trace の `requires_aws` 件数を保持しつつ、final candidate ready・fresh defect snapshot・artifact/external gates の充足時だけ blockers を空にする方針にした。
- `check-final-acceptance-readiness.js` は pending 固定ではなく、ready / pending の両分岐を明示検査する形にした。
- `acceptance package` の summary は final readiness の結果を反映し、local draft では従来通り pending を維持する。

## 実施作業

- `tools/final-acceptance-readiness.js` に fresh defect snapshot 判定と final-ready aggregate 判定を追加した。
- `tools/check-final-acceptance-readiness.js` を ready / pending 両分岐の検査へ変更した。
- `tools/check-final-acceptance-readiness-fixtures.js` に fresh defect snapshot の positive path と stale snapshot negative path を追加した。
- `tools/build-acceptance-package.js` / `tools/check-acceptance-package.js` が final readiness の ready / pending state を反映・検査するよう更新した。

## 成果物

- final evidence / checklist / CloudFormation / fresh defect snapshot が揃った場合に readiness が `final_acceptance_ready=true` へ遷移できる fixture。
- 現在の local preflight では `requires_aws` / pending external action を維持する package check。

## 検証

- pass: `npm run acceptance:final:fixture:check`
- pass: `npm run acceptance:final:check`
- pass: `npm run acceptance:package:check`
- pass: `npm run docs:check`
- pass: `npm run lint`
- pass: `npm run typecheck`
- pass: `npm run verify`

## fit 評価

- final-ready path が real command の checker から到達可能になり、runbook の final validation sequence と実装のずれを縮小した。
- local preflight は引き続き final acceptance complete を主張せず、外部 action は pending のまま維持している。

## 未対応・制約・リスク

- GitHub issue tracker 再取得、Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final checklist signoff は未実行。
- 実 final evidence ファイルは作成していないため、現在の `dist/acceptance/final_readiness.json` は `final_acceptance_ready=false` のまま。
