# Workers event publisher runtime mirror generation

状態: doing
タスク種別: 機能追加

## 背景

`.workspace/plam-20260530-01.txt` は `apps/agent` / `apps/workers` を TypeScript source-of-truth に寄せ、残存手書き source JS を廃止または generated 扱いにすることを求めている。`apps/workers/src/event-publisher.ts` は lightweight notification boundary の TS 正本を持つが、`apps/workers/src/event-publisher.js` は手書き runtime mirror として残っている。

## 目的

`apps/workers/src/event-publisher.ts` を正本とし、`apps/workers/src/event-publisher.js` を生成物として扱えるようにする。4KB payload 上限、禁止フィールド、REST detail URL の同期を drift check で保証する。

## Scope

- `event-publisher.ts` から `event-publisher.js` を生成する script を追加する。
- npm script / Taskfile / type surface check に生成 drift check を組み込む。
- source JS allowlist と local verification docs を更新する。
- worker notification を参照する performance checks と static checks を実行する。

## Non-scope

- Workers 全体の projector / ingestion / evaluation 分割。
- AppSync Events 実疎通、AWS dev/UAT 実行。
- 残存 source JS 全体の削除。

## 実施計画

1. `event-publisher.ts` / `.js` の runtime surface を確認する。
2. `tools/generate-workers-runtime-mirror.js` を追加し、generated header 付き mirror を出力する。
3. `package.json`、`Taskfile.yml`、`tools/check-type-surface.js`、`tools/source-js-allowlist.json`、`docs/ops/local-verification.md` を更新する。
4. 生成 check、worker notification を参照する checks、静的 check、CI workflow check、whitespace check を実行する。
5. 作業レポートを作成し、commit / push / PR コメント / task done 更新まで行う。

## ドキュメント保守計画

`docs/ops/local-verification.md` に Workers runtime mirror の生成・検証コマンドを追加する。README や API docs は runtime API 変更ではないため更新不要とする。

## 受け入れ条件

- [x] `tools/generate-workers-runtime-mirror.js` が追加され、`apps/workers/src/event-publisher.js` に生成 header が付く。
- [x] `npm run workers:generate` と `npm run workers:check` が利用でき、check が生成物 drift を検出できる。
- [x] `npm run typecheck:source` に Workers event publisher mirror check が統合される。
- [x] `tools/source-js-allowlist.json` が `event-publisher.js` を生成物として説明する。
- [x] `docs/ops/local-verification.md` と `Taskfile.yml` が新しい検証導線を説明する。
- [x] `npm run perf:local` と `npm run rag:perf:local` が pass する。
- [x] `npm run check:no-src-js`、`npm run check:static`、`npm run ci:check`、`git diff --check` が pass する。
- [ ] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で投稿する。

## 検証計画

- `npm run workers:generate`
- `npm run workers:check`
- `npm run typecheck:source`
- `npm run perf:local`
- `npm run rag:perf:local`
- `npm run check:no-src-js`
- `npm run check:static`
- `npm run ci:check`
- `git diff --check`

## PR レビュー観点

- TS 正本と JS mirror の notification payload behavior がずれていないこと。
- 禁止フィールド、4KB payload 上限、detail URL が維持されること。
- source JS allowlist の説明が generated mirror と一致すること。
- Workers の本番 projector 実装済みと誤認させないこと。

## リスク

- generator は対象 file 固有の構造に依存する。source の構造を大きく変える場合は generator assertion の更新が必要になる。
