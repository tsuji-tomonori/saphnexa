# Workers event publisher runtime mirror generation report

## 指示

- `.workspace/plam-20260530-01.txt` に対応する継続作業として、TypeScript source-of-truth 化と source JS transition gate を前進させる。
- repository local rules に従い、task md、検証、作業レポート、commit / PR コメントまで実施する。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | `apps/workers/src/event-publisher.ts` を正本にし、`.js` runtime mirror を生成物化する | 対応 |
| R2 | drift check を npm script / Taskfile / source gate へ組み込む | 対応 |
| R3 | lightweight notification の禁止フィールド、4KB 上限、detail URL を維持する | 対応 |
| R4 | source JS allowlist と local verification docs を更新する | 対応 |
| R5 | 実施していない検証を実施済み扱いしない | 対応 |

## 検討・判断

- `event-publisher.ts` は Workers lightweight notification boundary の TS source として存在していたため、手書き JS mirror を生成物へ移す方針を採った。
- generator は対象ファイル固有に限定し、interface 除去と function signature の最小変換だけを行う。TS source の `forbiddenNotificationFields` と `maxNotificationPayloadBytes` も JS mirror へ export し、public surface の差分を減らした。
- AppSync Events 実疎通や projector worker 実装は plan 上の残作業だが、今回の scope は runtime mirror 生成と drift check 追加に限定した。
- README / API docs は runtime API 変更ではないため更新不要と判断し、運用検証 docs のみ更新した。

## 実施作業

- `tools/generate-workers-runtime-mirror.js` を追加した。
- `apps/workers/src/event-publisher.js` を generated header 付き mirror に更新した。
- `package.json` に `workers:generate` / `workers:check` を追加した。
- `Taskfile.yml` に `workers:generate` / `workers:check` task を追加した。
- `tools/check-type-surface.js` に Workers runtime mirror drift check を統合した。
- `tools/source-js-allowlist.json` の `event-publisher.js` 理由を generated runtime mirror に更新した。
- `docs/ops/local-verification.md` に Workers runtime mirror check を追記した。
- `tasks/do/20260530-1518-workers-event-publisher-mirror.md` に受け入れ条件と検証計画を記録した。

## 成果物

| 成果物 | 内容 |
|---|---|
| `tools/generate-workers-runtime-mirror.js` | Workers TS source から JS runtime mirror を生成・検査する script |
| `apps/workers/src/event-publisher.js` | generated header 付き runtime mirror |
| `package.json` / `Taskfile.yml` | 生成・検査コマンド |
| `tools/check-type-surface.js` | source gate への mirror check 統合 |
| `tools/source-js-allowlist.json` | allowlist 理由更新 |
| `docs/ops/local-verification.md` | local verification docs 更新 |
| `tasks/do/20260530-1518-workers-event-publisher-mirror.md` | task 管理ファイル |

## 実行した検証

- `npm run workers:generate`: pass
- `npm run workers:check`: pass
- `npm run typecheck:source`: pass
- `npm run perf:local`: pass
- `npm run rag:perf:local`: pass
- `npm run check:no-src-js`: pass
- `npm run check:static`: pass
- `npm run ci:check`: pass
- `git diff --check`: pass

## Fit 評価

総合fit: 4.8 / 5.0（約96%）

理由: Workers event publisher mirror の生成化、drift check 統合、関連検証、docs / allowlist 更新は完了した。一方で `.workspace/plam-20260530-01.txt` 全体に対する残作業として、Workers projector / ingestion / evaluation 分割、他の source JS mirror 化、本番 strict gate、production-ready implementation coverage の planned marker 解消は残っている。

## 未対応・制約・リスク

- 未対応: Workers 全体の projector / ingestion / evaluation 分割、AppSync Events 実疎通、残存 source JS 全体の削除は今回の task scope 外。
- 制約: AWS dev/UAT 実接続は未実施。
- リスク: generator は `event-publisher.ts` 固有の構造に依存する。対象 source の形を大きく変える場合は generator の assertion 更新が必要になる。
