# Chat share operations boundary

## 背景

`.workspace` の基本設計では FR-SHARE-001〜003 / API-11〜13 として、owner がチャットを他の一般ユーザーへ viewer として共有し、共有状態の有効化・解除を管理できることが定義されている。
現行 PR #3 では local store/API に `addChatParticipant` / `updateChatParticipant` / `removeChatParticipant` があるが、DSQL query plan と Web Chat UI の共有操作境界は未接続である。

## 目的

Chat UI から owner が共有対象ユーザーを viewer として追加・再有効化・解除できる操作境界を追加する。local/source gate では owner だけが共有操作でき、viewer / outsider は共有操作できないことを確認する。

## タスク種別

機能追加

## スコープ

- DSQL repository に `addChatParticipant` / `updateChatParticipant` / `removeChatParticipant` query plan を追加する。
- Web Chat に共有操作 hook と参加者管理フォームを追加する。
- source/UI/web/a11y/docs/local flow gate を更新する。
- owner 移譲、viewer から owner への昇格、通知 fan-out の実 AppSync Events 配信、実 Aurora DSQL 実行、実ブラウザ E2E は今回の対象外とする。

## 実装計画

1. DSQL repository に owner 境界付きの参加者追加・viewer 再有効化・解除 query plan を追加する。
2. Web hook に `addChatParticipant` / `updateChatParticipant` / `removeChatParticipant` mutation を追加し、参加者一覧 query を invalidate する。
3. `ChatParticipantsPanel` に React Hook Form + Zod の viewer 共有フォームと、viewer の再有効化・解除操作を追加する。
4. `ChatPage` から csrfToken と mutation handler を接続する。
5. source/UI/web/a11y/docs/local flow gate に共有操作境界と未接続範囲を追加する。
6. 選定した検証コマンドを実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Chat 共有操作は route helper / generated operation helper と local/source gate で確認し、owner 移譲や実 AppSync Events fan-out は別途であることを追記する。

## 受け入れ条件

- [x] Web Chat が `addChatParticipant` / `updateChatParticipant` / `removeChatParticipant` route helper / generated operation helper を使う。
- [x] owner だけが viewer 共有、viewer 再有効化、viewer 解除を実行でき、viewer / outsider の共有操作は拒否される。
- [x] DSQL repository が `chat_participants` table を owner 境界付きで追加・更新・削除する。
- [x] UI/source/docs/local flow gate が Chat 共有操作境界を検査する。
- [x] 選定した検証コマンドが pass し、owner 移譲、viewer の owner 昇格、実 AppSync Events fan-out、実ブラウザ E2E を実施済みに見せない。

## 検証計画

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck -w @saphnexa/web`
- `npm run api-client:operation-types:check`
- `npm run ui:check`
- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run typecheck:source`
- `npm run docs:check`
- `npm run web:build:check`
- `npm run test:integration:local`
- `npm run test:contract`
- `npm test`
- `git diff --check`

## PR レビュー観点

- owner 境界が DSQL / local flow / UI 操作の前提として崩れていないこと。
- Web が固定参加者や fake user を本番 fallback として表示せず、入力値と API response / query state 由来で操作すること。
- owner 移譲、viewer の owner 昇格、実 AppSync Events fan-out を実装済みに見せていないこと。

## リスク

- この slice は local/source gate であり、実ブラウザ操作や CloudFront/Cognito 経由 HTTP の証跡ではない。
- 実 AppSync Events の参加者別通知 fan-out は対象外であり、共有操作境界に絞る。

## 検証結果

- pass: `npm run typecheck -w @saphnexa/api`
- pass: `npm run typecheck -w @saphnexa/web`
- pass: `npm run api-client:operation-types:check`
- pass: `npm run ui:check`
- pass: `npm run web:flow:check`
- pass: `npm run web:a11y:check`
- pass: `npm run typecheck:source`
- pass: `npm run docs:check`
- pass: `npm run web:build:check`
- pass: `npm run test:integration:local`
- pass: `npm run test:contract`
- pass: `npm test`
- pass: `git diff --check`

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4572168004
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4572169710

## 状態

done
