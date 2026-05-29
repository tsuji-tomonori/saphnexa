# Chat 回答単位お気に入り UI 境界

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-29 20:04
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: #3

## 背景

Chat のお気に入り API は `message_id` を受け取れるが、Web UI はチャット単位のお気に入り登録/解除に留まっている。`docs/ops/local-verification.md` でも回答単位のお気に入り UI と重複排除は未接続として残っている。

## 目的

参加中チャットの assistant 回答を message 単位でお気に入り登録/解除できる UI を追加し、local store で対象 message 検証と重複排除を行う。実ブラウザ E2E と実 Aurora DSQL SQL 実行は未接続として残す。

## スコープ

- local store `addFavorite`
- Web `MessageHistoryPanel` / `ChatPage`
- Web source/local/UI/a11y gates
- local integration test / docs

## 対象外

- Public API route 追加
- お気に入りの並び替え/検索
- 実ブラウザ E2E
- 実 Aurora DSQL SQL 実行

## 受け入れ条件

- [x] assistant 回答 message に対してお気に入り登録/解除ボタンが表示される。
- [x] 参加者だけが message favorite を登録でき、outsider は拒否される。
- [x] `addFavorite` は message が対象 chat の assistant message であることを検証する。
- [x] 同じ user/chat/message の重複 favorite は作らず既存 favorite を返す。
- [x] Web は既存 `addFavorite` / `deleteFavorite` route helper と generated operation helper を使う。
- [x] docs/source/UI/a11y gates 上で回答単位のお気に入り UI と重複排除は接続済みになり、実ブラウザ/実 Aurora DSQL は未接続として残る。
- [x] 選定した検証コマンドが pass する。

## 検証計画

- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck:source`
- `npm run web:flow:check`
- `npm run ui:check`
- `npm run web:a11y:check`
- `npm run test:integration:local`
- `npm test`
- `npm run docs:check`
- `npm run web:build:check`
- `git diff --check`

## PR セルフレビュー観点

- message favorite が chat 参加者境界を迂回しないこと。
- message_id だけで別 chat や user へ favorite を作らないこと。
- mock/dummy favorite を UI に出していないこと。
- 既存 public API route 契約を不要に増やしていないこと。

## 完了メモ

- 実装 commit: `6f0e0f7`
- 作業レポート: `reports/working/20260529-2004-chat-message-favorite-ui.md`
- PR 受け入れ条件コメント: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4574337159
- PR セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4574339405
- 検証:
  - `npm run typecheck -w @saphnexa/web`: pass
  - `npm run typecheck -w @saphnexa/api`: pass
  - `npm run typecheck:source`: pass
  - `npm run web:flow:check`: pass
  - `npm run ui:check`: pass
  - `npm run web:a11y:check`: pass
  - `npm run test:integration:local`: pass
  - `npm test`: pass
  - `npm run docs:check`: pass
  - `npm run test:contract`: pass
  - `npm run web:build:check`: pass。Vite の 500 kB chunk warning は出た。
  - `git diff --check`: pass
