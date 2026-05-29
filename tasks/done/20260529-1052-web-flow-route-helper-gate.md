# Web flow route helper gate fix

- 状態: done
- タスク種別: 修正
- 作成日時: 2026-05-29 10:52 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

API client route helper 追加後、GitHub Actions の `quality gates` が失敗した。ローカルで `npm run web:flow:check` を実行したところ `web flow scenarios failed` が再現した。

## なぜなぜ分析

### 問題文

2026-05-29 10:50 JST 頃、PR #3 の `quality gates` job とローカル `npm run web:flow:check` が、Web source contract の期待値不一致で失敗した。

### 確認済み事実

- `npm run typecheck`、`npm run typecheck -w @saphnexa/web`、`npm run build -w @saphnexa/web` は pass。
- `npm run web:flow:check` は `web flow scenarios failed` で fail。
- `tools/check-web-flows.js` は `useMe`、`useChatSessions`、`useAdminArtifacts`、`useStartEvaluationRun`、`assistantRuntime` に literal path token が含まれることを検査している。
- 直前の変更で Web source は literal path ではなく `apiRoutes` helper 経由へ移行した。

### 推定原因

- source gate が旧 contract の literal path 呼び出しを前提にしており、新 contract の `apiRoutes` helper 利用を受け入れていない。

### 根本原因

- 実装変更で Web fetch の source contract を「literal path」から「typed route helper」へ変更したが、`tools/check-web-flows.js` の Web flow source gate を同じ commit で更新しなかった。

### 影響範囲

- CI `quality gates`。
- `npm run web:flow:check`。
- runtime behavior には影響しない見込み。型チェックと Web build は pass 済み。

### 是正方針

- `tools/check-web-flows.js` を `apiRoutes` helper 利用を検査する source gate に更新する。
- route helper の literal path は `packages/api-client/src/client.ts` 側で検査する。
- `npm run web:flow:check` と quality gate 構成の関連 checks を再実行する。

## 受け入れ条件

- [x] `tools/check-web-flows.js` が Web hooks/pages の `apiRoutes` helper 利用を source contract として検査する。
- [x] API path literal の同期確認は `packages/api-client/src/client.ts` 側を見る。
- [x] `npm run web:flow:check` が pass する。
- [x] 関連 quality gate checks が pass する。
- [x] CI の `quality gates` が pass する。

## 検証計画

- `npm run web:flow:check`
- `npm run typecheck`
- `npm run ui:check`
- `npm run web:a11y:check`
- `npm run web:perf:local`
- `npm run web:bundle:check`
- `npm run docs:check`
- `git diff --check`

## 検証結果

- `npm run web:flow:check`: fail -> 修正後 pass。
- `npm run typecheck`: pass。
- `npm run ui:check`: pass。
- `npm run web:a11y:check`: pass。
- `npm run web:perf:local`: pass。
- `npm run web:bundle:check`: pass。
- `npm run coverage:check`: pass。
- `npm run perf:api:local`: pass。
- `npm run failure:check`: pass。
- `npm run rag:quality:check`: pass。
- `npm run rag:security:check`: pass。
- `npm run rag:perf:local`: pass。
- `npm run docs:check`: pass。
- `git diff --check`: pass。
- CI `quality gates`: pass。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4569813978
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4569815358

## PR レビュー観点

- gate の緩和ではなく、新しい route helper contract への追従になっていること。
- Web source が absolute URL や外部 origin を使う退行を許していないこと。
- CI failure を完了扱いにしないこと。
