# OpenAPI nested client types

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-29 11:42 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` は、Zod/OpenAPI 生成型と frontend/backend 共有型が未完成であるとしている。前回までに generated operation type と operation-aware request helper は追加したが、OpenAPI response schema は主要 object/array を `ApiClientJsonObject` として扱う箇所が多く、配列要素や nested object の詳細型が不足している。

## 目的

OpenAPI document の主要 success response に domain object の field-level schema を追加し、API client generated 型が nested object/array の主要フィールドを TypeScript 型として参照できる状態へ進める。

## スコープ

- `apps/api/src/openapi-document.ts` の主要 response schema に chat/user/message/event/artifact/evaluation 等の reusable schema helper を追加する。
- generated `operation-types.ts` を再生成し、配列要素や nested object の主要フィールドが concrete type になることを確認する。
- source gate で nested object/array 型の代表トークンを検査する。
- API runtime 実装、実 CloudFront/Cognito HTTP、AWS runtime validation、全 route 全 field の完全 schema 化は別 slice とし、完了扱いにしない。

## 実装計画

1. 現在の OpenAPI response schema と generated operation type の不足箇所を確認する。
2. 主要 domain object schema helper を `openapi-document.ts` に追加する。
3. response schema を `jsonObjectSchema()` から reusable typed schema へ置き換える。
4. generated operation type を再生成し、source gate を更新する。
5. typecheck、contract/source gate、docs check を実行する。

## ドキュメント保守方針

API route contract の path/status は変えない。local verification docs には、nested generated 型の検査範囲と、実 HTTP / runtime validation は未対応であることを追記する。

## 受け入れ条件

- [x] OpenAPI success response の主要 object/array が concrete field schema を持つ。
- [x] generated `operation-types.ts` の主要 response が nested object/array の field-level 型を持つ。
- [x] source gate が nested generated 型の代表例を検査する。
- [x] API client と Web の TypeScript 検証が pass する。
- [x] 実 HTTP / runtime validation / 全 route 全 field 完全型付けを完了扱いにしない。

## 検証計画

- `node tools/build-api-client-operation-types.js --check`
- `npm run typecheck:source`
- `npm run typecheck -w @saphnexa/api-client`
- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck`
- `npm run test:contract`
- `npm run docs:check`
- `git diff --check`

## PR レビュー観点

- OpenAPI schema と generated client 型が同期していること。
- `ApiClientJsonObject` を完全排除したと誤認させず、対象を主要 response に限定していること。
- 既存 API runtime contract、route-level authorization、CSRF 境界を変更していないこと。
- 実 HTTP や AWS runtime validation を過大に完了扱いしていないこと。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4570038301
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4570039285

## 検証結果

- `node tools/build-api-client-operation-types.js --check`: pass。
- `npm run typecheck:source`: pass。
- `npm run typecheck -w @saphnexa/api-client`: pass。
- `npm run typecheck -w @saphnexa/web`: pass。
- `npm run typecheck`: pass。
- `npm run test:contract`: pass。
- `npm run web:flow:check`: pass。
- `npm run docs:check`: pass。
- `npm test`: pass。15 tests。
- `npm run build -w @saphnexa/web`: pass。
- `git diff --check`: pass。

## リスク・制約

- 今回は主要 response object の field-level 型化に限定する。
- 実 CloudFront/Cognito 経由 HTTP、AWS runtime validation は未対応。
