# WebSocket ticket DSQL coverage slice

- 状態: doing
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 18:32 JST
- タスク種別: 機能追加

## 背景

Admin list audit slice 後も `issueWsTicket` は coverage manifest 上で production planned marker を持つ。
`docs/generated/db/lifecycle.md` は `ws_tickets` を `ws_ticket_events` append 後に projector が projection 更新する table として扱っているが、DSQL repository には `issueWsTicket` mapping が存在しない。

## 目的

`issueWsTicket` の DSQL query plan を追加し、`ws_tickets` projection row と `ws_ticket_events` domain event を同一 plan 内で作成する。
その上で coverage manifest と generated mirror を実装実態に合わせ、API production coverage の planned marker を 14 件から 13 件へ減らす。

## 対象 API

- `issueWsTicket`

## 実施計画

1. `ws_tickets` / `ws_ticket_events` schema と local ticket behavior を確認する。
2. DSQL repository に `issueWsTicket` mapping を追加する。
3. `packages/api-contract/src/implementation-coverage.ts` から対象 API の planned marker を外す。
4. generated coverage mirror を再生成する。
5. coverage / local integration / static checks を実行する。
6. 作業レポート、commit / push、PR コメント、CI 確認、task done 移動まで実施する。

## ドキュメントメンテナンス計画

- API response shape、route、OpenAPI schema は変更しないため durable docs の更新は不要と判断する。
- `docs/generated/db/lifecycle.md` は既に `ws_tickets` が `ws_ticket_events` から projector 更新される前提を記載しているため、今回は実装を既存 docs に合わせる。
- 一時的な作業記録は task md と `reports/working/` に残す。

## 受け入れ条件

- [ ] `issueWsTicket` の DSQL mapping key が存在する。
- [ ] `issueWsTicket` の DSQL query plan が `ws_tickets` row を作成する。
- [ ] `issueWsTicket` の DSQL query plan が `ws_ticket_events` に domain event を append する。
- [ ] DSQL map が API response shape (`ticket`, `expires_in_seconds`, `channels`) を維持する。
- [ ] `packages/api-contract/src/implementation-coverage.ts` 上で対象 API に planned marker が残らない。
- [ ] generated coverage mirror が更新される。
- [ ] `npm run implementation-coverage:generate` が成功する。
- [ ] `npm run implementation-coverage:check` が成功する。
- [ ] `npm run api:implementation:check` が成功し、planned marker 数が 13 件になる。
- [ ] `npm run api:implementation:check:production` の失敗リストから対象 API が消える。
- [ ] `npm run test:integration:local` が成功する。
- [ ] `npm run web:flow:check` が成功する。
- [ ] `npm run typecheck:source` が成功する。
- [ ] `npm run check:static` が成功する。
- [ ] `git diff --check` が成功する。
- [ ] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- [ ] GitHub Actions の PR check が成功する。

## PR レビュー観点

- ticket TTL と channel scope が local behavior と一致していること。
- domain event append が `ws_ticket_events` schema に合っていること。
- response shape が OpenAPI schema と一致していること。
- coverage manifest が実装実態より過大な完了扱いになっていないこと。

## リスク

- projection table への直接 insert も残るため、完全な projector 化ではない。今回の scope は DSQL mapping と domain event append の追加に限定する。
- consume/reuse/expiration の DSQL mapping は今回 scope 外。
