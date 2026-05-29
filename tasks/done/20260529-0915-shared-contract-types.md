# Shared contract TypeScript types

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-29 09:15 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` では、API contract / model catalog / tool contract はあるが、Zod/OpenAPI 生成型、DB 生成型、frontend/backend 共有型としては未完成と判定されている。PR #3 では API / Agent / Web / UI の TS entry は追加したが、共有 contract/catalog/schema の TS source と型 surface はまだ薄い。

## 目的

API / Tools / Model catalog / DB schema の共有境界に TypeScript source と export 型を追加し、既存 JS runtime と同期していることを source gate で確認できるようにする。

## スコープ

- `packages/api-contract/src/routes.ts` を追加し、公開 API route metadata 型を定義する。
- `packages/tool-contract/src/tools.ts` を追加し、Tools API contract 型を定義する。
- `packages/model-catalog/src/models.ts` と `cost-estimate.ts` を追加し、model catalog / cost estimate 型を定義する。
- `packages/db-schema/src/tables.ts` を追加し、required table name 型を定義する。
- `tools/check-type-surface.js` を更新し、TS source と JS runtime mirror の同期を検査する。
- docs/report を更新する。

## 範囲外

- OpenAPI からの自動型生成。
- DB introspection / codegen。
- npm install 後の実 `tsc` compilation。

## 実施計画

1. 既存 JS contract/catalog/schema を確認する。
2. 対応する `.ts` source と型を追加する。
3. source gate で `.ts` と `.js` の件数・主要 ID 同期を確認する。
4. docs と作業レポートを更新する。
5. contract / type / unit / docs 検証を実行する。

## ドキュメント保守方針

- `docs/ops/local-verification.md` に shared TS contract source の確認範囲と未完了の codegen 範囲を追記する。
- 一時的な判断と未実施事項は `reports/working/` に記録する。

## 受け入れ条件

- [x] API route metadata の TypeScript source と export 型がある。
- [x] Tools API contract の TypeScript source と export 型がある。
- [x] Model catalog / cost estimate の TypeScript source と export 型がある。
- [x] DB required table list の TypeScript source と union 型がある。
- [x] source gate が TS source と JS runtime mirror の件数・主要 ID 同期を検査する。
- [x] 既存 contract / unit tests が pass する。
- [x] 自動 codegen や実 `tsc` compilation を実施済み扱いにしない。

## 完了時確認

- PR: https://github.com/tsuji-tomonori/saphnexa/pull/3
- 受け入れ条件コメント: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4569366284
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4569367727
- 作業レポート: `reports/working/20260529-0917-shared-contract-types.md`

## 検証計画

- `npm run typecheck`
- `npm run test:contract`
- `npm test`
- `npm run docs:check`
- `git diff --check`

## PR レビュー観点

- 共有型が既存 JS runtime と矛盾していないこと。
- 既存 route/tool/model/table 数が変わっていないこと。
- 実 codegen 未実施を明記していること。

## リスク

- `.ts` source と `.js` runtime mirror の二重管理は暫定であり、依存 install 後の codegen / build 整備で単一 source 化する必要がある。
