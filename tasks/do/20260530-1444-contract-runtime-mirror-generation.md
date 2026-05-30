# Contract runtime mirror 生成化

## 背景

`.workspace/plam-20260530-01.txt` は TypeScript source-of-truth 化と source JS mirror 廃止・生成化を求めている。coverage manifest の `.js` mirror は前タスクで generated mirror になったが、`packages/api-contract/src/routes.js` と `packages/tool-contract/src/tools.js` はまだ手書き runtime mirror として残っている。

## 目的

API contract と Tool contract の runtime `.js` mirror を `.ts` source から生成・検査できる状態にし、手書き JS mirror を減らす。

## タスク種別

機能追加

## スコープ

- `packages/api-contract/src/routes.ts` から `packages/api-contract/src/routes.js` を生成する script を追加する。
- `packages/tool-contract/src/tools.ts` から `packages/tool-contract/src/tools.js` を生成する script を追加する。
- check mode で committed `.js` mirror と generator 出力の一致を検査する。
- 既存 contract check または type surface check に generated mirror 検査を組み込む。
- docs と source JS allowlist を generated mirror 前提に更新する。

## スコープ外

- contract `.js` mirror の完全削除。
- `apps/api/src/*.js` や他 packages の JS mirror 生成化。
- production-ready strict source JS gate を pass させること。
- API 40件や Tools 6件の production 実装完了。

## 実施計画

1. API / Tool contract TS source の現行 literal 定義から JS mirror を生成する script を追加する。
2. 既存 `.js` mirror を generated header 付きの出力へ更新する。
3. check script と package scripts、docs、allowlist を更新する。
4. targeted checks と `check:static` を実行する。
5. 作業レポート、commit、push、PR コメント、task done 更新を行う。

## ドキュメント保守方針

`docs/ops/local-verification.md` に、contract runtime mirror が TS source から生成され、check mode で一致検査されることを追記する。

## 受け入れ条件

- [x] AC1: contract `.js` mirror を生成する script が存在する。
- [x] AC2: `npm run contract-mirror:generate` が定義され、API / Tool contract mirror を生成できる。
- [x] AC3: `npm run contract-mirror:check` が定義され、committed mirror と生成結果の一致を検査できる。
- [x] AC4: `npm run test:contract` または `npm run check:static` の導線で generated mirror drift を検出できる。
- [x] AC5: `npm run check:no-src-js` が pass する。
- [x] AC6: `npm run check:static` が pass する。
- [x] AC7: `git diff --check` が pass する。
- [ ] AC8: PR に受け入れ条件確認とセルフレビュー更新を日本語で投稿する。

## 検証計画

- `npm run contract-mirror:check`
- `npm run test:contract`
- `npm run check:no-src-js`
- `npm run check:static`
- `git diff --check`

## PR レビュー観点

- `.js` mirror が TS source 由来であることが機械的に確認できること。
- API 40件 / Tools 6件の contract 件数・ID・path が変わっていないこと。
- runtime import 互換を壊していないこと。

## リスク

- generator は contract TS source の現在の factory call 書式に依存する。書式変更時は generator と check が fail するようにし、無音 drift を避ける。

## 状態

in_progress
