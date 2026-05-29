# Workers TypeScript source

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-29 10:30 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` は最終的に `apps/workers/**/*.ts` も TypeScript 設計へ寄せるべきとしている。現在の `apps/workers` は `event-publisher.js` のみで、AppSync Events / WebSocket 通知境界の軽量 payload 制約が typed source として検証されていない。

## 目的

Workers package に TypeScript source と package typecheck を追加し、chat message event から生成する lightweight notification の contract、禁止フィールド、4KB payload 制限を source gate で確認できる状態へ進める。

## スコープ

- `apps/workers/src/event-publisher.ts` に typed notification boundary を追加する。
- `apps/workers/package.json` と `apps/workers/tsconfig.json` を追加・更新し、package 単体 typecheck を可能にする。
- root typecheck と source gate に workers TS source を含める。
- `docs/ops/local-verification.md` に workers TS source gate の範囲と未完了扱いを追記する。
- 既存 `.js` runtime mirror の挙動変更、実 AppSync Events publish、実 WebSocket push は扱わない。

## 実装計画

1. `event-publisher.ts` を追加し、input event、notification、禁止フィールド、4KB 上限を型と関数で表す。
2. `apps/workers` の typecheck script と tsconfig を追加する。
3. `tsconfig.typecheck.json` と `tools/check-type-surface.js` を更新する。
4. docs と task に検証結果を記録し、PR コメントまで進める。

## ドキュメント保守方針

実運用手順は変えないため、`docs/ops/local-verification.md` の local/source gate 説明だけを最小更新する。

## 受け入れ条件

- [x] `apps/workers/src/event-publisher.ts` が lightweight notification contract を typed source として export する。
- [x] Workers package が `tsc --noEmit --project tsconfig.json` の typecheck script を持つ。
- [x] Workers TS source が root `npm run typecheck` の実 `tsc` 対象に含まれる。
- [x] source gate が Workers TS source と JS runtime mirror の主要 token 同期を確認する。
- [x] notification payload の禁止フィールドと 4KB 上限が TS source と source gate で確認できる。
- [x] 実 AppSync Events publish / WebSocket push を完了扱いにしない。

## 検証計画

- `npm run typecheck`
- `npm run typecheck -w @saphnexa/workers`
- `npm run test:contract`
- `npm test`
- `npm run docs:check`
- `git diff --check`

## 検証結果

- `npm run typecheck`: pass。
- `npm run typecheck -w @saphnexa/workers`: pass。
- `npm run test:contract`: pass。
- `npm test`: pass。15 tests。
- `npm run docs:check`: pass。
- `git diff --check`: pass。

## PR レビュー観点

- 通知 payload が `answer_text`、`citation_text`、`retrieved_chunk_text`、`content_text` を含まない制約を緩めていないこと。
- `detail_url` が REST detail fetch を指す軽量通知境界として維持されていること。
- 実 AppSync Events publish を完了扱いにしていないこと。

## リスク・制約

- 既存 runtime は `.js` mirror のまま維持するため、今回の TS source は型境界と source gate の前進に限定される。
- 実 AWS AppSync Events / WebSocket 接続、CloudFront 経由の realtime delivery は別 slice の対象。
