# 作業完了レポート

保存先: `reports/working/20260529-1221-web-realtime-contract-hardening.md`

## 1. 受けた指示

- 主な依頼: `.workspace` の基本設計と `plan-20260529.txt` に基づき、TypeScript / framework / atomicity / generated 型の不足を継続的に前進させる。
- 追加指示: main を pull/fetch してから作業する。
- 今回の対象: Web realtime client の設計契約を、基本設計 v0.17 の相対 `/event/realtime`、ticket 非 query、REST復旧方針へ寄せる。

## 2. 要件整理

| 要件ID | 指示・要件 | 重要度 | 対応状況 |
|---|---|---:|---|
| R1 | 作業前に `origin/main` を取得し、worktree状態を確認する | 高 | 対応 |
| R2 | React が AWS 実サービスドメインを保持せず、相対 `/event/realtime` を使う | 高 | 対応 |
| R3 | WebSocket URL query に ticket / chat_id / message_id を載せない | 高 | 対応 |
| R4 | Subscribe payload に ticket と API 由来 channel を含める | 高 | 対応 |
| R5 | 通知受信後に REST で message events を再取得する wiring にする | 高 | 対応 |
| R6 | source gate / docs / typecheck / build で検証する | 高 | 対応 |
| R7 | 実 AppSync Events E2E を完了扱いしない | 高 | 対応 |

## 3. 検討・判断したこと

- 基本設計 v0.17 は、React から見える WebSocket を `wss://${window.location.host}/event/realtime` とし、React に API Gateway や AppSync の実ドメインを持たせない方針としている。
- 現状の実装は env endpoint と URL query ticket に寄っていたため、同一 origin の relative endpoint と subscribe payload に責務を寄せた。
- 通知 payload は本文の代替ではなく「新しいイベントが利用可能」の合図であるため、通知時に TanStack Query の message events query を `refetch` する形にした。
- API が返す `channels` を使い、UI側で固定 user/channel を作らない方針にした。

## 4. 実施した作業

- `apps/web/src/lib/realtimeClient.ts` を更新し、default endpoint を `/event/realtime` にした。
- WebSocket 接続URLへ ticket / chat_id / message_id を載せず、open後に `{ type: "subscribe", ticket, channels }` を送るようにした。
- `apps/web/src/hooks/useMessageRealtime.ts` を更新し、ticket/channels/onNotification を受ける hook にした。
- `apps/web/src/pages/ChatPage.tsx` を更新し、`issueWsTicket` の返却 channel を保存して realtime hook へ渡し、通知後に `events.refetch()` を実行するようにした。
- `tools/check-web-flows.js` と `tools/check-type-surface.js` を更新し、realtime source contract を検査するようにした。
- `docs/ops/local-verification.md` に検証範囲と未検証範囲を追記した。

## 5. 成果物

| 成果物 | 形式 | 内容 | 指示との対応 |
|---|---|---|---|
| `apps/web/src/lib/realtimeClient.ts` | TypeScript | 相対 realtime endpoint と payload subscribe contract | R2/R3/R4 |
| `apps/web/src/hooks/useMessageRealtime.ts` | TypeScript | ticket/channel/onNotification hook | R4/R5 |
| `apps/web/src/pages/ChatPage.tsx` | TSX | ticket response channel と REST refetch の wiring | R4/R5 |
| `tools/check-web-flows.js` / `tools/check-type-surface.js` | JS | source gate 更新 | R6 |
| `docs/ops/local-verification.md` | Markdown | local verification の範囲説明 | R6/R7 |

## 6. 指示へのfit評価

| 評価軸 | 評価 | 理由 |
|---|---:|---|
| 指示網羅性 | 4 | realtime client contract は前進したが、実 AppSync Events E2E は未実施 |
| 制約遵守 | 5 | main fetch、task md、report、未実施検証の明記を実施 |
| 成果物品質 | 4 | source gate / typecheck / build で検査可能。実クラウド接続は別途必要 |
| 説明責任 | 5 | 設計との差分、検証、制約を明記 |
| 検収容易性 | 5 | 変更ファイルと検証コマンドを明示 |

総合fit: 4.5 / 5.0（約90%）

理由: Web realtime の設計契約は改善したが、実 AppSync Events subscribe / ブラウザE2Eは未検証のため満点ではない。

## 7. 検証

- `npm run typecheck -w @saphnexa/web`: pass。
- `npm run web:flow:check`: pass。
- `npm run web:a11y:check`: pass。
- `npm run build -w @saphnexa/web`: pass。
- `npm run docs:check`: pass。
- `npm run typecheck`: pass。
- `git diff --check`: pass。

## 8. 未対応・制約・リスク

- 実 AppSync Events の subscribe 成功は未検証。
- CloudFront 経由 `/event/realtime` の実ブラウザ接続は未検証。
- assistant-ui runtime の実 streaming 挙動は未検証。
