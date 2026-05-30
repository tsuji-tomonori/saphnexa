# Domain runtime mirror 生成化

## 背景

`.workspace/plam-20260530-01.txt` は TypeScript source-of-truth 化と source JS mirror 廃止・生成化を求めている。`packages/domain/src/index.ts` と `packages/domain/src/observability.ts` は TypeScript source として実データ・関数を持つ一方、対応する `.js` は手書き runtime compatibility surface として残っている。

## 目的

Domain public surface と observability catalog の `.js` runtime mirror を `.ts` source から生成・検査できる状態にし、手書き JS mirror を減らす。

## タスク種別

機能追加

## スコープ

- `packages/domain/src/index.ts` から `packages/domain/src/index.js` を生成する script を追加する。
- `packages/domain/src/observability.ts` から `packages/domain/src/observability.js` を生成する script を追加する。
- check mode で committed `.js` mirror と generator 出力の一致を検査する。
- 既存 type surface / observability check の導線で generated mirror drift を検出できるようにする。
- docs と source JS allowlist を generated mirror 前提に更新する。

## スコープ外

- `packages/domain/src/store.js` の TS 正本化。
- Domain package の runtime import を `.ts` へ切り替えること。
- production-ready strict source JS gate を pass させること。

## 実施計画

1. `index.ts` / `observability.ts` の現行 export から JS mirror を生成する script を追加する。
2. 既存 `.js` mirror を generated header 付き出力へ更新する。
3. check script、package scripts、Taskfile、docs、allowlist を更新する。
4. targeted checks と `check:static` を実行する。
5. 作業レポート、commit、push、PR コメント、task done 更新を行う。

## ドキュメント保守方針

`docs/ops/local-verification.md` に、Domain runtime mirror が TS source から生成され、check mode で一致検査されることを追記する。

## 受け入れ条件

- [x] AC1: domain `.js` mirror を生成する script が存在する。
- [x] AC2: `domain:generate` が `.js` runtime mirror を生成できる。
- [x] AC3: `domain:check` が committed mirror と生成結果の一致を検査できる。
- [x] AC4: type surface / observability の既存検査導線で generated mirror drift を検出できる。
- [x] AC5: `npm run check:no-src-js` が pass する。
- [x] AC6: `npm run check:static` が pass する。
- [x] AC7: `git diff --check` が pass する。
- [ ] AC8: PR に受け入れ条件確認とセルフレビュー更新を日本語で投稿する。

## 検証計画

- `npm run domain:check`
- `npm run typecheck:source`
- `npm run observability:check`
- `npm run check:no-src-js`
- `npm run check:static`
- `git diff --check`

## PR レビュー観点

- Domain constants / helper 関数 / observability catalog の値が変化していないこと。
- `.js` mirror が TS source 由来であることを機械的に確認できること。
- Store、API、RAG、認可境界の挙動を変えていないこと。

## リスク

- generator は Domain TS source の現行 export 書式に依存する。書式変更時は generator と check が fail するようにし、無音 drift を避ける。

## 状態

in_progress
