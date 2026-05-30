# Coverage JS mirror 生成化

## 背景

`.workspace/plam-20260530-01.txt` は TypeScript source-of-truth と JS mirror 廃止を求めている。前回作業で coverage manifest の `.ts` source と `.js` runtime mirror の drift check は追加したが、`.js` mirror はまだ手編集可能なファイルとして残っている。

## 目的

API / Tools implementation coverage の `.js` runtime mirror を `.ts` source から生成・検査できる状態にし、手書き JS mirror から generated mirror へ寄せる。

## タスク種別

機能追加

## スコープ

- `packages/api-contract/src/implementation-coverage.ts` から `implementation-coverage.js` を生成する script を追加する。
- `packages/tool-contract/src/implementation-coverage.ts` から `implementation-coverage.js` を生成する script を追加する。
- check mode で生成結果と committed `.js` mirror の一致を検査する。
- `check:implementation-coverage-source` / `check:static` に生成一致検査を組み込む。
- generated mirror であることを docs / allowlist / file header に明記する。

## スコープ外

- coverage `.js` mirror の削除。
- 既存 `routes.js` / `tools.js` など他 JS mirror の生成化。
- production-ready strict gate を pass させること。

## 実施計画

1. TS source から coverage entry を抽出して JS mirror を生成する script を追加する。
2. 既存 `.js` mirror を generator 出力に合わせる。
3. check script と package scripts、docs、allowlist を更新する。
4. targeted checks と `check:static` を実行する。
5. 作業レポート、commit、push、PR コメント、task done 更新を行う。

## ドキュメント保守方針

`docs/ops/local-verification.md` に、coverage JS mirror が TS source から生成され、check mode で一致検査されることを追記する。

## 受け入れ条件

- [x] AC1: coverage `.js` mirror を生成する script が存在する。
- [x] AC2: `npm run implementation-coverage:generate` が定義され、mirror を生成できる。
- [x] AC3: `npm run implementation-coverage:check` が定義され、committed mirror と生成結果の一致を検査できる。
- [x] AC4: `npm run check:implementation-coverage-source` が生成一致検査を含み、pass する。
- [x] AC5: `npm run check:static` が pass する。
- [x] AC6: `git diff --check` が pass する。
- [ ] AC7: PR に受け入れ条件確認とセルフレビュー更新を日本語で投稿する。

## 検証計画

- `npm run implementation-coverage:check`
- `npm run check:implementation-coverage-source`
- `npm run api:implementation:check`
- `npm run tools:implementation:check`
- `npm run check:static`
- `git diff --check`

## PR レビュー観点

- `.js` mirror が TS source 由来であることが機械的に確認できること。
- planned marker を削って未実装を実装済みに見せていないこと。
- RAG / authorization / benchmark 実装に無関係な挙動変更がないこと。

## リスク

- generator は coverage manifest の現在の書式に依存する。書式変更時は generator と check が fail するようにし、無音 drift を避ける。

## 状態

in_progress
