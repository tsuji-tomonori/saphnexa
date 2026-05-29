# API client operation request helpers

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-29 11:29 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` は、Zod/OpenAPI 生成型と frontend/backend 共有型が未完成であるとしている。前回までに API client generated operation type map は追加したが、Web 側の `apiGet<T>` / `apiPost<T>` 呼び出しはまだ手書き generic を使っている。

## 目的

`@saphnexa/api-client` に generated operation 型を使う request helper を追加し、Web の主要 API 呼び出しを operationId に紐づく request/response 型へ移行する。

## スコープ

- `apiGetOperation` / `apiPostOperation` など operation-aware helper を追加する。
- helper は operationId の method と generated request/response 型を TypeScript 上で制約する。
- Web hooks/pages/runtime の主要呼び出しを手書き response generic から operation-aware helper へ移行する。
- source gate で Web が operation-aware helper を使うことを確認する。
- 実 HTTP 挙動、runtime validation、全画面の完全型付けは別 slice とし、完了扱いにしない。

## 実装計画

1. generated operation type map を `client.ts` 内部型として import する。
2. method 別 operationId 型と request body input 型を追加する。
3. operation-aware helper を追加し、既存 `request` 実装を流用する。
4. Web の主要 API 呼び出しを `apiGetOperation` / `apiPostOperation` へ移行する。
5. source gate、docs、report、validation を更新する。

## ドキュメント保守方針

API route contract は変えない。local verification docs に operation-aware helper の確認範囲と、実 HTTP / runtime validation は未対応であることを追記する。

## 受け入れ条件

- [x] `@saphnexa/api-client` が generated operation 型に基づく request helper を export する。
- [x] operation-aware helper が method 不一致の operationId を TypeScript 上で拒否する。
- [x] Web の主要 API 呼び出しが手書き response generic ではなく operation-aware helper を使う。
- [x] source gate が operation-aware helper と Web 移行を確認する。
- [x] 実 HTTP / runtime validation / 全画面完全型付けを完了扱いにしない。

## 検証計画

- `npm run typecheck:source`
- `npm run typecheck -w @saphnexa/api-client`
- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck`
- `npm run build -w @saphnexa/web`
- `npm run web:flow:check`
- `npm run docs:check`
- `git diff --check`

## 検証結果

- `npm run typecheck:source`: pass。
- `npm run typecheck -w @saphnexa/api-client`: pass。
- `npm run typecheck -w @saphnexa/web`: fail -> generated 型により `evaluation_run.status` が `unknown` として検出されたため、`statusFromEvaluationRun` で runtime shape を確認してから表示するよう修正後 pass。
- `npm run typecheck`: pass。
- `npm run build -w @saphnexa/web`: pass。
- `npm run web:flow:check`: fail -> operation-aware helper 移行に合わせて source gate 期待値を更新後 pass。
- `npm run test:contract`: pass。
- `npm run docs:check`: pass。
- `npm test`: pass。15 tests。
- `git diff --check`: pass。

## PR レビュー観点

- operationId と HTTP method の型制約が効いていること。
- Web 側が generated response 型に移行し、手書き generic が残っていないこと。
- CSRF token は既存の header/body injection 境界を壊していないこと。
- 実 HTTP や runtime validation を過大に完了扱いしていないこと。

## リスク・制約

- 今回は Web の主要 API 呼び出しに限定する。
- 実 CloudFront/Cognito 経由 HTTP、AWS runtime validation は未対応。
