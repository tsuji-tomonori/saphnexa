# API TypeScript source of record

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-29 09:08 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` では、Hono backend は Hono + Zod OpenAPI の骨格はあるが `.js` 実装中心で、TypeScript 実装としては未達と判定されている。PR #3 で `apps/api/src/app.ts` は追加したが、既存の Hono/OpenAPI source of record は `hono-openapi-app.js`、`openapi-document.js`、`zod-openapi-schemas.js` のまま残っている。

## 目的

API の Hono/OpenAPI/Zod schema 実装を TypeScript source of record に移し、既存 Node 実行パス向けには `.js` wrapper を残す。

## スコープ

- `apps/api/src/hono-openapi-app.ts` を追加し、Hono app factory の実体を TypeScript にする。
- `apps/api/src/openapi-document.ts` を追加し、OpenAPI document builder の実体を TypeScript にする。
- `apps/api/src/zod-openapi-schemas.ts` を追加し、Zod schema catalog の実体を TypeScript にする。
- 既存 `.js` ファイルは `.ts` から re-export / CLI delegation する互換 wrapper にする。
- OpenAPI source gate を `.ts` source of record を検査するよう更新する。
- docs/report を更新する。

## 範囲外

- 実 Lambda adapter / Cognito session / DSQL repository 接続。
- 依存 install 後の実 `tsc` compilation。
- 外部 AWS state の変更。

## 実施計画

1. 既存 JS Hono/OpenAPI 実装を TypeScript ファイルへ移す。
2. `.js` wrapper を残し、既存 tests/tools の import 互換を保つ。
3. `tools/check-api-openapi.js` と `tools/check-type-surface.js` を TypeScript source of record 前提に更新する。
4. docs と作業レポートを更新する。
5. API / contract / integration / docs 検証を実行する。

## ドキュメント保守方針

- `docs/ops/local-verification.md` に API TypeScript source of record の確認範囲と未完了範囲を追記する。
- 一時的な判断と未実施事項は `reports/working/` に記録する。

## 受け入れ条件

- [ ] Hono app factory の実体が `apps/api/src/hono-openapi-app.ts` にある。
- [ ] OpenAPI document builder の実体が `apps/api/src/openapi-document.ts` にある。
- [ ] Zod schema catalog の実体が `apps/api/src/zod-openapi-schemas.ts` にある。
- [ ] 既存 `.js` files は TypeScript source への互換 wrapper になっている。
- [ ] OpenAPI/source gate が `.ts` source of record を検査する。
- [ ] 公開 API 38 route と OpenAPI operation count が維持される。
- [ ] 既存 contract / integration / unit tests が pass する。
- [ ] 実 Lambda / DSQL / Cognito 接続や実 `tsc` compilation は実施済み扱いにしない。

## 検証計画

- `npm run typecheck`
- `npm run api:openapi:check`
- `npm run test:contract`
- `npm run test:integration:local`
- `npm test`
- `npm run docs:check`
- `git diff --check`

## PR レビュー観点

- `.js` wrapper が既存 Node tools/tests の import 互換を壊さないこと。
- TypeScript source of record が API route metadata、CSRF metadata、role metadata、Zod validation metadata を維持すること。
- 実接続未完了項目を完了扱いにしていないこと。

## リスク

- TypeScript 実体へ移しても、この環境では `tsc` 実体が未導入のため実 compilation は未検証。
