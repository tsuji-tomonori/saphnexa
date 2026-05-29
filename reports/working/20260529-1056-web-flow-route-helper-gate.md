# Web flow route helper gate fix 作業レポート

## 指示

- `.workspace` の基本設計と `plan-20260529.txt` をもとに継続作業を進める。
- 作業前に `main` を pull/fetch してから進める。
- CI failure を残したまま完了扱いにしない。

## 問題

API client route helper 追加後、PR #3 の `quality gates` job が失敗し、ローカルでも `npm run web:flow:check` が `web flow scenarios failed` で再現した。

## RCA 要約

- 直接原因: `tools/check-web-flows.js` が Web hooks/pages に literal `/api/...` path が含まれることを source contract として要求していた。
- 変更点: Web fetch は `apiRoutes` helper 経由へ移行した。
- 根本原因: 実装の source contract を「literal path」から「typed route helper」に変更したが、Web flow source gate を同時に更新していなかった。
- 対策: Web hook/page は `apiRoutes.*` 利用を検査し、literal API path は `packages/api-client/src/client.ts` 側で検査するよう gate を更新した。

## 実施作業

- `tools/check-web-flows.js` を更新し、`useMe`、`useChatSessions`、`useAdminArtifacts`、`useStartEvaluationRun`、`assistantRuntime` が `apiRoutes` helper を使うことを検査。
- API literal path の同期確認を `packages/api-client/src/client.ts` へ移した。
- 修正 task に RCA、受け入れ条件、検証結果を記録。

## 成果物

| 成果物 | 内容 |
|---|---|
| `tools/check-web-flows.js` | Web flow source gate の route helper 対応 |
| `tasks/do/20260529-1052-web-flow-route-helper-gate.md` | 修正 task と RCA |

## 実行した検証

- `npm run web:flow:check`: fail -> 修正後 pass
- `npm run typecheck`: pass
- `npm run ui:check`: pass
- `npm run web:a11y:check`: pass
- `npm run web:perf:local`: pass
- `npm run web:bundle:check`: pass
- `npm run coverage:check`: pass
- `npm run perf:api:local`: pass
- `npm run failure:check`: pass
- `npm run rag:quality:check`: pass
- `npm run rag:security:check`: pass
- `npm run rag:perf:local`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass

## fit 評価

総合fit: 4.5 / 5.0（約90%）

理由: CI failure の直接原因を再現し、source gate を新しい typed route helper contract に合わせて修正した。CI 上の再実行結果は fix push 後に確認する必要があるため満点ではない。

## 未対応・制約・リスク

- fix commit push 前時点では GitHub Actions の `quality gates` 再実行結果は未確認。
- 実ブラウザ / CloudFront E2E は今回の修正対象外。
