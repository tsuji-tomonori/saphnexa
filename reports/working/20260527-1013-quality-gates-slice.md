# coverage・UI品質・failure injection ローカル検収スライス 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/local.md` を参考に実装し、`.workspace/Saphnexa_検収受入条件_package_v1.0` を満たすまで継続する。
- リポジトリの task / PR / report / verification ルールに従う。

## 要件整理

- AC-121 は coverage threshold、AC-130 は非AI API性能、AC-135 は failure injection 3ケースが明示されている。
- AC-051/054/055 は UI 技術方針、a11y、performance の要求があるが、axe/Playwright/Lighthouse は未導入のため、ローカル静的 gate と smoke に限定する。

## 検討・判断

- coverage は Node test runner の `--experimental-test-coverage` と threshold flags を使い、line 80% / branch 70% 未満で fail する形にした。
- UI/a11y は実 DOM ではなく source static gate とし、axe の代替完了とは扱わない。
- performance は local non-AI API smoke と web source gzip/route fixture smoke に分け、AWS load test や Lighthouse は未実施として trace に残した。
- failure injection は通常質問経路に影響しない `failure_injection` 入力で、retrieval/generation/worker notify の3系統を検査した。

## 実施作業

- `tools/check-coverage.js`、`tools/check-ui-quality.js`、`tools/check-web-performance.js`、`tools/check-api-performance.js`、`tools/check-failure-injection.js` を追加。
- `packages/domain/src/store.js` に async failure handling を追加し、failed 状態、`chat.run.failed` event、`retryable=true` を残すようにした。
- `quality-gates` GitHub Actions job、npm scripts、Taskfile、admin test report suite、CI workflow checker を更新。
- `docs/ops/local-verification.md` と `docs/acceptance/traceability.md` を更新。

## 成果物

- `npm run coverage:check`
- `npm run ui:check`
- `npm run web:perf:local`
- `npm run perf:api:local`
- `npm run failure:check`
- `quality-gates` CI job

## 指示への fit 評価

- ローカルで検証できる品質・復旧ゲートを CI と `verify` に組み込んだ。
- 実施していない axe/Playwright/Lighthouse/AWS load test/実 AgentCore 障害注入は未実施として明記した。
- 作業前に task md と Done 条件を明示した。

## 検証

- `npm run coverage:check`: pass（all files line 93.74%、branch 80.13%）
- `npm run ui:check`: pass
- `npm run web:perf:local`: pass
- `npm run perf:api:local`: pass
- `npm run failure:check`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `npm run acceptance:check`: pass
- `npm run admin-artifacts:build`: pass
- `npm run artifacts:check`: pass
- `npm test`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- PR #1 GitHub Actions `Saphnexa CI`: pass（quality gates job を含む 12 jobs）

## 未対応・制約・リスク

- axe/Playwright の実 DOM accessibility report、Lighthouse CI、本番 bundler analyzer report は未実施。
- AWS/CloudWatch を使った load test と実 AgentCore/Lambda failure injection は未実施。
