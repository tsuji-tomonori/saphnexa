# Web assistant runtime provider boundary

## 背景

`plan-20260529.txt` では、Chat UI が assistant-ui を中核として使うことが未達として示されている。
現状は `apps/web/src/lib/assistantRuntime.ts` に `ChatModelAdapter` があるが、`ChatPage` の React tree には `AssistantRuntimeProvider` / `useLocalRuntime` が入っておらず、assistant-ui runtime adapter 境界止まりである。

## 目的

Chat UI に assistant-ui の runtime provider 境界を追加し、既存の REST submit / message events / realtime refetch と併存する形で assistant-ui runtime を React tree に接続する。

## タスク種別

機能追加

## スコープ

- Chat UI に `AssistantRuntimeProvider` と `useLocalRuntime` を使う runtime boundary component を追加する。
- `createSaphnexaAssistantAdapter` を runtime provider と既存 submit 経路の双方で使いやすい形に整理する。
- `tools/check-web-flows.js`、`tools/check-ui-quality.js`、`tools/check-type-surface.js`、docs を更新する。
- 実ブラウザ streaming、assistant-ui primitive の full replacement、AppSync Events 実接続は今回の対象外とする。

## 実装計画

1. `AssistantRuntimeBoundary` component を追加する。
2. `ChatPage` で active chat / CSRF token があるときに runtime boundary で chat main content を包む。
3. assistant runtime helper を submit accepted result を返す関数へ整理し、adapter と ChatPage submit で共有する。
4. Web/source/docs gate を更新する。
5. Web typecheck/build/flow/docs/diff check を実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、assistant-ui runtime provider が source/build gate で確認できることと、実ブラウザ streaming は未検証であることを明記する。

## 受け入れ条件

- [ ] Chat UI が `AssistantRuntimeProvider` と `useLocalRuntime` を React tree に持つ。
- [ ] assistant adapter が `submitQuestion` route helper / generated operation helper を使い、架空 message id を生成しない。
- [ ] 既存の REST submit、WS ticket issue、message events refetch 経路が残る。
- [ ] source/UI/web flow/docs gate が assistant runtime provider 境界を検査する。
- [ ] 選定した検証コマンドが pass し、実ブラウザ streaming / AppSync Events 実接続を実施済み扱いしていない。

## 検証計画

- `npm run typecheck -w @saphnexa/web`
- `npm run web:build:check`
- `npm run web:flow:check`
- `npm run ui:check`
- `npm run typecheck:source`
- `npm run docs:check`
- `git diff --check`

## PR レビュー観点

- assistant-ui runtime provider が UI tree に入り、型 import だけで終わっていないこと。
- 既存 REST/realtime の実データ由来 flow を壊していないこと。
- 実ブラウザ streaming / AppSync Events 実接続の未検証範囲が PR コメントとレポートに残ること。

## リスク

- assistant-ui primitive に全面移行するには UI/UX 調整と実ブラウザ検証が必要なため、今回は runtime provider 接続に留める。
- CSRF token と active chat がない状態では provider を張らず、正直な disabled/empty state を維持する。

## 状態

do
