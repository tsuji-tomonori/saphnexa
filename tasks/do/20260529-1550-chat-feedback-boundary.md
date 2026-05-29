# Chat feedback boundary

## 背景

`.workspace` の基本設計では FR-U-005 と API-18 として、一般ユーザーが閲覧可能な回答へ高評価、低評価、自由記述のフィードバックを登録できることが定義されている。
現行 PR #3 では `createFeedback` の API contract / route helper / OpenAPI schema は存在するが、local API dispatch、domain store、DSQL query plan、Web Chat UI からの操作境界はまだ未接続である。

## 目的

Chat UI から現在表示している回答にフィードバックを登録できる API/UI 境界を追加する。local/source gate では参加者だけが対象メッセージへ登録でき、未参加者は拒否されることを確認する。

## タスク種別

機能追加

## スコープ

- `message_feedback` の shared record type と local domain state 型を追加する。
- `packages/domain` local store と `apps/api` local API に `createFeedback` を追加する。
- DSQL repository に `createFeedback` query plan を追加する。
- Web Chat に `useCreateFeedback` hook とフィードバック操作 panel を追加する。
- source/UI/web/docs/local flow gate を更新する。
- 実ブラウザ E2E、フィードバック一覧・取消、実 Aurora DSQL 実行、実 AppSync Events 通知は今回の対象外とする。

## 実装計画

1. `MessageFeedbackRecord` 型を domain store type / DB shared type と整合させる。
2. local store/API に `createFeedback` を追加し、対象チャット参加者だけが対象メッセージへ登録できるようにする。
3. DSQL repository に `message_feedback` への insert plan を追加する。
4. Web hook と Chat feedback panel を追加し、`ChatPage` の active answer message に接続する。
5. source/UI/web/docs gate と local flow を更新する。
6. 選定した検証コマンドを実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Chat feedback は route helper / generated operation helper と local/source gate で確認し、実ブラウザ E2E と取消・一覧 UX は別途であることを追記する。

## 受け入れ条件

- [x] Web Chat が `createFeedback` route helper / generated operation helper を使う。
- [x] local store/API が参加者だけ対象メッセージへフィードバック登録でき、未参加者を拒否する。
- [x] DSQL repository と shared record type が `message_feedback` table を扱う。
- [x] UI/source/docs/local flow gate が Chat feedback 境界を検査する。
- [x] 選定した検証コマンドが pass し、実ブラウザ E2E や未実装の取消・一覧を実施済みに見せない。

## 検証計画

- [x] `npm run typecheck -w @saphnexa/api`
- [x] `npm run typecheck -w @saphnexa/web`
- [x] `npm run typecheck -w @saphnexa/db-types`
- [x] `npm run api-client:operation-types:check`
- [x] `npm run ui:check`
- [x] `npm run web:flow:check`
- [x] `npm run web:a11y:check`
- [x] `npm run typecheck:source`
- [x] `npm run docs:check`
- [x] `npm run web:build:check`
- [x] `npm run test:integration:local`
- [x] `npm run test:contract`
- [x] `npm test`
- [x] `git diff --check`

## 検証結果

2026-05-29 に上記コマンドをすべて実行し pass。`web:build:check` は Vite の 500 kB chunk warning を出したが、既存の build output gate は gzip 146400 bytes で pass。

## PR レビュー観点

- フィードバック登録がチャット参加者境界を越えていないこと。
- Web が API response / mutation state 由来で表示し、固定 feedback や fake count を表示していないこと。
- `message_feedback` の primary key と local store の上書き挙動が矛盾していないこと。
- 未実装の取消・一覧・実通知を UI や PR 本文で実装済みに見せていないこと。

## リスク

- この slice は local/source gate であり、実ブラウザ操作や CloudFront/Cognito 経由 HTTP の証跡ではない。
- フィードバックは登録境界に絞り、一覧、取消、分析集計 UI は対象外とする。

## 状態

ready_for_pr_comment
