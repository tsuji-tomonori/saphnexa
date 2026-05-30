# DB tables runtime mirror 生成化

## 背景

`.workspace/plam-20260530-01.txt` は TypeScript source-of-truth 化と source JS mirror 廃止・生成化を求めている。`packages/db-schema/src/tables.ts` は required table list の TypeScript source を持つが、`packages/db-schema/src/tables.js` は手書き runtime compatibility surface として残っている。

## 目的

required DB table list の `.js` runtime mirror を `.ts` source から生成・検査できる状態にし、手書き JS mirror を減らす。

## タスク種別

機能追加

## スコープ

- `packages/db-schema/src/tables.ts` から `packages/db-schema/src/tables.js` を生成する script を追加する。
- check mode で committed `.js` mirror と generator 出力の一致を検査する。
- 既存 DB metadata / type surface check の導線で generated mirror drift を検出できるようにする。
- docs と source JS allowlist を generated mirror 前提に更新する。

## スコープ外

- `packages/db-schema/src/table-metadata.js` の TS 正本化。
- DB metadata 全体の source-of-truth を SQL から TS に移すこと。
- production-ready strict source JS gate を pass させること。

## 実施計画

1. `tables.ts` から required table list を抽出して `tables.js` を生成する script を追加する。
2. 既存 `tables.js` を generated header 付き出力へ更新する。
3. check script、package scripts、Taskfile、docs、allowlist を更新する。
4. targeted checks と `check:static` を実行する。
5. 作業レポート、commit、push、PR コメント、task done 更新を行う。

## ドキュメント保守方針

`docs/ops/local-verification.md` に、DB table runtime mirror が TS source から生成され、check mode で一致検査されることを追記する。

## 受け入れ条件

- [x] AC1: `tables.js` を生成する script が存在する。
- [x] AC2: `db-schema:tables:generate` が `.js` runtime mirror を生成できる。
- [x] AC3: `db-schema:tables:check` が committed mirror と生成結果の一致を検査できる。
- [x] AC4: DB metadata / type surface の既存検査導線で generated mirror drift を検出できる。
- [x] AC5: `npm run check:no-src-js` が pass する。
- [x] AC6: `npm run check:static` が pass する。
- [x] AC7: `git diff --check` が pass する。
- [ ] AC8: PR に受け入れ条件確認とセルフレビュー更新を日本語で投稿する。

## 検証計画

- `npm run db-schema:tables:check`
- `npm run typecheck:source`
- `npm run db:metadata:check`
- `npm run check:no-src-js`
- `npm run check:static`
- `git diff --check`

## PR レビュー観点

- required table list の値が変化していないこと。
- `.js` mirror が TS source 由来であることを機械的に確認できること。
- DB migration や metadata の意味を変えていないこと。

## リスク

- generator は `tables.ts` の現行 array export 書式に依存する。書式変更時は generator と check が fail するようにし、無音 drift を避ける。

## 状態

in_progress
