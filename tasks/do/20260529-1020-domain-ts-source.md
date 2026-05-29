# Domain TypeScript source

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-29 10:20 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` は API / Agent / Web に加えて `packages/domain/**/*.ts` も TypeScript 設計へ寄せる必要があるとしている。現在の `packages/domain` は runtime mirror として `.js` のみを公開しており、権限 helper、status/role/event 名、observability catalog、local store 境界が typed source として検証されていない。

## 目的

Domain package の公開 domain contract と local store 境界を TypeScript source として定義し、JS runtime mirror と主要 token が同期される状態へ進める。

## スコープ

- `packages/domain/src/index.ts` に role/status/event/helper/error contract の typed source を追加する。
- `packages/domain/src/observability.ts` に log/metric/alarm/retention catalog の typed source を追加する。
- `packages/domain/src/store-types.ts` に local store state、actor、chat/RAG/admin artifact 境界の typed source を追加する。
- `packages/domain/tsconfig.json` と root typecheck include を TS source 対象へ更新する。
- source gate と local verification docs を更新する。
- JS runtime mirror の挙動変更や実 DSQL/Cognito/AppSync 接続は扱わない。

## 実装計画

1. Domain TS source を追加し、既存 JS runtime mirror の主要 contract と同じ token を持たせる。
2. typecheck 対象と source gate に domain TS source を追加する。
3. docs/ops のローカル検証メモへ domain TS source の位置付けを追記する。
4. typecheck、契約テスト、docs check、diff check を実行する。

## ドキュメント保守方針

実行手順や外部運用は変えないため、永続 docs は `docs/ops/local-verification.md` の typecheck/source gate 説明のみ最小更新する。

## 受け入れ条件

- [x] `packages/domain/src/index.ts` が role/status/event/helper/error contract を typed source として export する。
- [x] `packages/domain/src/observability.ts` が log schema、metric、alarm、retention catalog を typed source として export する。
- [x] `packages/domain/src/store-types.ts` が local store state と主要 repository/service 境界を typed source として export する。
- [x] Domain TS source が `npm run typecheck` の実 `tsc` 対象に含まれる。
- [x] source gate が Domain TS source と JS runtime mirror の主要 token 同期を確認する。
- [x] JS runtime mirror の挙動変更や実 DSQL/Cognito/AppSync 接続を完了扱いにしない。

## 検証計画

- `npm run typecheck`
- `npm run test:contract`
- `npm test`
- `npm run docs:check`
- `git diff --check`

## 検証結果

- `npm run typecheck`: pass。
- `npm run typecheck -w @saphnexa/domain`: pass。
- `npm run test:contract`: pass。
- `npm test`: pass。15 tests。
- `npm run docs:check`: pass。
- `git diff --check`: pass。

## PR レビュー観点

- Domain TS source が JS runtime mirror と矛盾していないこと。
- 権限 helper (`canReadChat`, `canWriteChat`, `canManageAdmin`) の contract が緩和されていないこと。
- Local store 型が架空の本番接続完了を示さず、local boundary として明示されていること。

## リスク・制約

- 既存 runtime は `.js` mirror のまま維持するため、今回の TS source は型境界と source gate の前進に限定される。
- 実 DB 生成型や AWS runtime 接続は別 slice の対象。
