# Workers TypeScript source 作業レポート

## 指示

- `.workspace` の基本設計と `plan-20260529.txt` をもとに、TypeScript framework implementation の未達項目を継続して進める。
- 作業前に `main` を pull/fetch してから進める。
- repository local workflow に従い、task md、検証、PR コメント、作業レポートを残す。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | `origin/main` を取得し、作業ブランチが main を取り込んでいることを確認する | 対応 |
| R2 | `apps/workers/**/*.ts` の typed source を追加し、plan の TypeScript 方針へ近づける | 対応 |
| R3 | JS runtime mirror と TS source の主要 token 同期を source gate で確認する | 対応 |
| R4 | lightweight notification の禁止フィールドと 4KB 上限を維持する | 対応 |
| R5 | 実 AppSync Events publish / WebSocket push を完了扱いにしない | 対応 |

## 検討・判断

- 既存 local tests と tools は `apps/workers/src/event-publisher.js` を import しているため、今回は runtime 置換ではなく typed source と source gate の追加に限定した。
- 通知 payload は full answer や chunk text を含めず、REST detail URL を返す軽量境界を維持した。
- `forbiddenNotificationFields` と `maxNotificationPayloadBytes` を TS source の exported contract とし、source gate で JS runtime mirror の禁止 token と 4096 byte 制限を確認する方針にした。

## 実施作業

- `apps/workers/src/event-publisher.ts` を追加し、`ChatMessageEventForNotification`、`LightweightNotification`、`createLightweightNotification`、`assertNotificationIsLightweight` を定義。
- `apps/workers/package.json` に `typecheck` script と TypeScript devDependency を追加。
- `apps/workers/tsconfig.json` を追加。
- `tsconfig.typecheck.json` に workers TS/JS source を追加。
- `tools/check-type-surface.js` に workers package typecheck script と TS/JS mirror token gate を追加。
- `docs/ops/local-verification.md` に workers TS source gate と未完了扱いの範囲を追記。
- `tasks/do/20260529-1030-workers-ts-source.md` に受け入れ条件と検証結果を記録。

## 成果物

| 成果物 | 内容 |
|---|---|
| `apps/workers/src/event-publisher.ts` | Lightweight notification typed source |
| `apps/workers/tsconfig.json` | Workers package TypeScript 設定 |
| `apps/workers/package.json` | Workers package typecheck script |
| `tools/check-type-surface.js` | Workers TS/JS mirror gate |
| `docs/ops/local-verification.md` | local verification docs 更新 |
| `tasks/do/20260529-1030-workers-ts-source.md` | task 記録 |

## 実行した検証

- `npm run typecheck`: pass
- `npm run typecheck -w @saphnexa/workers`: pass
- `npm run test:contract`: pass
- `npm test`: pass。15 tests。
- `npm run docs:check`: pass
- `git diff --check`: pass

## fit 評価

総合fit: 4.3 / 5.0（約86%）

理由: plan の `apps/workers/**/*.ts` 方針に対し、worker notification boundary を TypeScript source として追加し、source gate と実 `tsc` で検証できる状態にした。一方で、runtime は引き続き `.js` mirror であり、`.ts` からの runtime artifact 生成や実 AppSync Events / WebSocket 配信は未対応のため満点ではない。

## 未対応・制約・リスク

- `apps/workers/src/event-publisher.js` の runtime 実装そのものは TS へ置換していない。
- `.ts` source から runtime artifact を生成して local tools/tests を動かす構成は未対応。
- 実 AppSync Events publish、WebSocket push、CloudFront 経由 realtime delivery は別 slice の対象。
