# Chat owner 移譲境界

- 状態: do
- タスク種別: 機能追加
- 作成日時: 2026-05-29 20:26
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: #3

## 背景

Chat 共有操作は owner による viewer 共有、再有効化、共有解除までは source/local gate で確認済みだが、`docs/ops/local-verification.md` では owner 移譲が未接続として残っている。既存 `updateChatParticipant` route は `participant_role` を受け取る境界を持つため、新規 public route を増やさず owner 移譲を接続できる。

## 目的

既存 viewer を新 owner に昇格し、移譲した旧 owner を viewer へ降格する。常に active owner が 1 人だけ残ること、owner 以外が移譲できないこと、outsider が移譲できないことを local/source gate で確認する。実 AppSync Events fan-out、実ブラウザ E2E、実 Aurora DSQL SQL 実行は未接続として残す。

## スコープ

- local store `updateParticipant`
- DSQL repository `updateChatParticipant` query plan
- Web `ChatParticipantsPanel` / participant hook
- local integration / web flow / UI / a11y / type surface gates
- `docs/ops/local-verification.md`

## 対象外

- Public API route 追加
- 複数 owner 管理
- owner 自身の削除
- 実 AppSync Events fan-out
- 実ブラウザ E2E
- 実 Aurora DSQL SQL 実行

## 受け入れ条件

- [ ] owner が active viewer を owner に移譲できる。
- [ ] 移譲後、旧 owner は viewer になり、新 owner だけが active owner になる。
- [ ] 移譲後、旧 owner は owner-only 操作を拒否され、新 owner は owner-only 操作を実行できる。
- [ ] viewer / outsider は owner 移譲を実行できない。
- [ ] Web は既存 `updateChatParticipant` route helper / generated operation helper を使って owner 移譲ボタンを実ハンドラに接続する。
- [ ] docs/source/UI/a11y gates 上で owner 移譲は接続済みになり、owner 昇格の任意増殖、実 AppSync Events fan-out、実ブラウザ/実 Aurora DSQL は未接続として残る。
- [ ] 選定した検証コマンドが pass する。

## 実装計画

1. local store の `updateParticipant` で `participant_role: "owner"` を owner transfer として扱う。
2. DSQL `updateChatParticipant` plan を transfer CTE へ更新し、旧 owner 降格と target viewer 昇格を同一 plan にする。
3. Web hook と参加者一覧 UI に owner 移譲ボタンを追加し、架空操作ではなく既存 mutation へ接続する。
4. local/source/UI/a11y/docs gates を同期する。
5. 変更範囲に応じた typecheck / local integration / source gate / docs / build checks を実行する。

## ドキュメントメンテナンス計画

- `docs/ops/local-verification.md` の Chat 共有操作項目を、owner 移譲が local/source gate 接続済みである状態へ更新する。
- 実 AppSync Events fan-out、実ブラウザ E2E、実 Aurora DSQL SQL 実行は未接続として残す。

## 検証計画

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck:source`
- `npm run web:flow:check`
- `npm run ui:check`
- `npm run web:a11y:check`
- `npm run test:integration:local`
- `npm test`
- `npm run docs:check`
- `npm run test:contract`
- `npm run web:build:check`
- `git diff --check`

## PR セルフレビュー観点

- owner 移譲後に active owner が 0 人または複数人にならないこと。
- viewer / outsider が owner 移譲や owner-only 操作を実行できないこと。
- UI が未実装操作を表示せず、実 mutation に接続されていること。
- 既存 public API route 契約を不要に増やしていないこと。
