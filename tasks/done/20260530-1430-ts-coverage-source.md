# Coverage manifest TypeScript source 化

## 背景

`.workspace/plam-20260530-01.txt` は API / Tools API / Agent / Workers / Web を TypeScript source-of-truth へ移行することを求めている。前回作業で coverage manifest は `packages/api-contract` / `packages/tool-contract` 配下に移ったが、現時点では `.js` runtime surface のみであり、TypeScript source-of-truth としては不足している。

## 目的

API / Tools implementation coverage manifest に `.ts` source を追加し、`.js` runtime mirror が TypeScript source と drift していないことを機械的に検査する。

## タスク種別

機能追加

## スコープ

- `packages/api-contract/src/implementation-coverage.ts` を追加する。
- `packages/tool-contract/src/implementation-coverage.ts` を追加する。
- `.js` runtime mirror と `.ts` source の operation/status token drift を検査する gate を追加する。
- `check:static` に drift gate を組み込む。
- docs / report / PR コメントを更新する。

## スコープ外

- `.js` runtime mirror の完全削除。
- TS build artifact 生成パイプラインの導入。
- production-ready strict gate を pass させること。

## 実施計画

1. TS manifest に必要な型を定義し、API / Tools manifest を `.ts` source として追加する。
2. JS mirror と TS source の operation keys / status tokens / external reason を比較する check script を追加する。
3. package scripts、docs、allowlist を更新する。
4. targeted checks と `check:static` を実行する。
5. 作業レポート、commit、push、PR コメント、task done 更新を行う。

## ドキュメント保守方針

`docs/ops/local-verification.md` に、coverage manifest は `.ts` source と `.js` runtime mirror の drift gate を持つことを追記する。

## 受け入れ条件

- [x] AC1: `packages/api-contract/src/implementation-coverage.ts` が存在し、API coverage 型と manifest を export している。
- [x] AC2: `packages/tool-contract/src/implementation-coverage.ts` が存在し、Tools coverage 型と manifest を export している。
- [x] AC3: JS runtime mirror と TS source の drift check が存在する。
- [x] AC4: `npm run check:implementation-coverage-source` が定義され、pass する。
- [x] AC5: `npm run check:static` に drift check が含まれ、pass する。
- [x] AC6: `git diff --check` が pass する。
- [x] AC7: PR に受け入れ条件確認とセルフレビュー更新を日本語で投稿する。

## 検証計画

- `npm run check:implementation-coverage-source`
- `npm run api:implementation:check`
- `npm run tools:implementation:check`
- `npm run check:static`
- `git diff --check`

## PR レビュー観点

- TS source と JS runtime mirror の drift を検出できること。
- planned marker を削って未実装を実装済みに見せていないこと。
- RAG / authorization / benchmark 実装に無関係な挙動変更がないこと。

## リスク

- JS runtime mirror は引き続き残るため、完全な no-src-js strict pass ではない。今回の目的は TS source 追加と drift gate に限定する。

## 状態

done
