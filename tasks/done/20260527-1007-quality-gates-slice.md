# coverage・UI品質・failure injection ローカル検収スライス

## 背景

- 検収 trace では AC-121 の coverage threshold、AC-130 の非AI API性能、AC-135 の failure injection が未実装または未検証。
- AC-051/054/055 は UI 技術方針、a11y、bundle/performance の要求があるが、現状は source scaffold のみで検査が弱い。

## 目的

- ローカルと CI で再現できる品質ゲートを追加し、検収 package の P1/P2 条件を前進させる。
- 実施していない axe/Playwright/Lighthouse/AWS load test は未実施として明確に残す。

## スコープ

- Node test coverage の line >=80%、branch >=70% gate。
- UI 共通 package 利用、直書き style 禁止、基本 a11y attribute の静的検査。
- Web source gzip size と route transition fixture の性能検査。
- 非AI API local p95 <=800ms、error rate <1% の smoke 検査。
- Agent/Worker failure injection 3ケースの状態・event・retryable 検査。
- npm scripts、Taskfile、CI workflow、trace、作業レポート更新。

## スコープ外

- axe/Playwright による実 DOM accessibility report。
- Lighthouse CI、本番相当 bundler の artifact report。
- AWS/CloudWatch を使った負荷試験。
- 実 AgentCore Runtime / Worker Lambda の障害注入。

## タスク種別

機能追加

## チェックリスト

- [x] coverage threshold checker を追加する。
- [x] UI architecture / static a11y checker を追加する。
- [x] web performance / bundle smoke checker を追加する。
- [x] non-AI API local performance checker を追加する。
- [x] failure injection 3ケースの実装と検査を追加する。
- [x] npm scripts、Taskfile、CI workflow、docs/trace を更新する。
- [x] 検証を実行し、作業レポートを作成する。
- [x] commit/push/PR コメント/セルフレビュー/task done 更新まで完了する。

## Done 条件

- Deliverables:
  - coverage、UI品質、web性能、API性能、failure injection の検査 script がある。
  - failure injection 時に failed 状態、error event、retryable 状態が観測できる。
  - `npm run verify` と CI に品質ゲートが組み込まれている。
  - acceptance trace と作業レポートが更新されている。
- Validations:
  - `npm run coverage:check` pass
  - `npm run ui:check` pass
  - `npm run web:perf:local` pass
  - `npm run perf:api:local` pass
  - `npm run failure:check` pass
  - `npm test` pass
  - `npm run verify` pass
  - `git diff --check` pass
  - `pre-commit run --files <changed-files>` pass

## 受け入れ条件

- [x] coverage gate は Node coverage threshold で all files line/branch 80/70 未満を fail にする。
- [x] UI 静的検査は common UI package 利用率 90%以上、直書き style 0件、主要 landmark/label を検査する。
- [x] web performance smoke は gzip 500KB 以下と route transition p95 500ms 以下を検査する。
- [x] non-AI API smoke は認証済み通常API p95 <=800ms、error rate <1% を検査する。
- [x] failure injection は retrieval / generation / worker notify の3ケースで failed 状態、error event、retryable を検査する。
- [x] axe/Lighthouse/AWS load test/実 AgentCore 障害注入は未実施として trace/report に明記する。

## 検証計画

- `npm run coverage:check`
- `npm run ui:check`
- `npm run web:perf:local`
- `npm run perf:api:local`
- `npm run failure:check`
- `npm test`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

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
- `pre-commit run --files <changed-files>`: pass

## ドキュメント保守方針

- `docs/acceptance/traceability.md` は local static/smoke と AWS/real-browser 未実施を分けて記載する。
- `docs/ops/local-verification.md` に追加コマンドを反映する。

## PR レビュー観点

- coverage や performance の数値が固定値ではなく実行結果から判定されていること。
- UI 静的検査を axe/Lighthouse の代替完了として過大表現していないこと。
- failure injection が単に error を投げるだけでなく、状態・event・retryable を残していること。

## リスク

- 静的 a11y/bundle smoke は実ブラウザや Lighthouse の証跡ではないため、最終検収には別途 browser/E2E report が必要。

## 状態

done

## PR

- Pull Request: https://github.com/tsuji-tomonori/saphnexa/pull/1
- 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550390347
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550391066
- GitHub Apps は既知の `Resource not accessible by integration` のため、`gh` fallback で PR コメントを投稿した。
