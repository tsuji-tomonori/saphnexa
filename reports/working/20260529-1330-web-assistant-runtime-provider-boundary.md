# Web assistant runtime provider boundary 作業レポート

## 受けた指示

- `main` を pull してから作業する。
- `.workspace` の基本設計と `plan-20260529.txt` に沿って、Chat UI の assistant-ui 利用不足を前進させる。
- リポジトリの Worktree Task PR Flow、task md、検証、PR コメント、作業レポート規約に従う。

## 要件整理

- Chat UI の React tree に assistant-ui の `AssistantRuntimeProvider` と `useLocalRuntime` を接続する。
- 既存の REST submit、WS ticket issue、message events refetch を壊さない。
- `submitQuestion` は route helper / generated operation helper を使い、架空の message id を生成しない。
- source/UI/web flow/docs gate で runtime provider 境界を確認できるようにする。
- 実ブラウザ streaming や AppSync Events 実接続は今回の検証済み扱いにしない。

## 検討・判断

- assistant-ui primitive への全面置換は UI/UX と実ブラウザ検証の範囲が大きいため、今回は runtime provider boundary component を追加し、既存の実データ由来 flow と併存させた。
- CSRF token または active chat がない状態では provider を張らず、既存の disabled/empty state を維持する。
- `ChatPage` の submit と adapter が同じ `submitAssistantQuestion` helper を使う形にし、operation-aware request helper への依存を明示した。

## 実施作業

- `apps/web/src/features/chat/AssistantRuntimeBoundary.tsx` を追加し、`AssistantRuntimeProvider` / `useLocalRuntime` / `createSaphnexaAssistantAdapter` を接続した。
- `apps/web/src/pages/ChatPage.tsx` で chat main content を `AssistantRuntimeBoundary` で包み、submit 経路を `submitAssistantQuestion` に寄せた。
- `apps/web/src/lib/assistantRuntime.ts` に `submitAssistantQuestion` を追加し、adapter と ChatPage で共有した。
- `tools/check-web-flows.js`、`tools/check-ui-quality.js`、`tools/check-web-accessibility-report.js`、`tools/check-type-surface.js` に assistant runtime provider 境界の source gate を追加した。
- `docs/ops/local-verification.md` に、provider 境界は source/build gate で確認し、実ブラウザ streaming と AppSync Events 実接続は別途確認する旨を追記した。

## 成果物

- Task: `tasks/do/20260529-1326-web-assistant-runtime-provider-boundary.md`
- Runtime boundary: `apps/web/src/features/chat/AssistantRuntimeBoundary.tsx`
- 更新 docs: `docs/ops/local-verification.md`
- 更新 gate: `tools/check-web-flows.js`, `tools/check-ui-quality.js`, `tools/check-web-accessibility-report.js`, `tools/check-type-surface.js`

## 検証

- PASS: `npm run typecheck -w @saphnexa/web`
- PASS: `npm run web:flow:check`
- PASS: `npm run ui:check`
- PASS: `npm run web:a11y:check`
- PASS: `npm run typecheck:source`
- PASS: `npm run docs:check`
- PASS: `npm run web:build:check`
- PASS: `git diff --check`

## Fit 評価

- 受け入れ条件のうち、React tree への provider 接続、route helper / generated operation helper 経由の submit、既存 REST/WS/refetch 経路の維持、source/UI/web/docs gate の更新、検証の実施を満たした。
- 実ブラウザ streaming と AppSync Events 実接続は対象外として docs と本レポートに残しており、実施済み扱いにはしていない。

## 未対応・制約・リスク

- assistant-ui primitive への UI 全面移行は未対応。
- 実ブラウザでの assistant-ui streaming 挙動、CloudFront/Cognito 経由の実 HTTP、AppSync Events 実 subscribe は未検証。
- provider は active chat と CSRF token がある場合だけ有効化するため、未認証または chat 未選択時は既存 UI の disabled/empty state に依存する。
