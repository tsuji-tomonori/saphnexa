# API DSQL query planning boundary

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-29 12:41 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- 参照:
  - `/home/t-tsuji/project/saphnexa/.workspace/plan-20260529.txt`
  - `/home/t-tsuji/project/saphnexa/.workspace/Saphnexa_基本設計書_v0.17_package.zip`

## 背景

`plan-20260529.txt` では Hono API が TypeScript 実装・実 Lambda adapter・実 DSQL 接続まで未完であることが課題として整理されている。
現状の `DsqlApiRepository` は interface と unbound 501 response のみで、operation ごとの DSQL query plan や executor 境界がない。

## 目的

Hono API の DSQL 接続へ向けて、operation ごとの SQL plan と executor interface を追加する。
この slice は Aurora DSQL 実接続の完了ではなく、local fixture dispatcher と区別された DSQL repository 実装境界を前進させる。

## スコープ

- `apps/api/src/repositories/dsql/apiRepository.ts`
- `apps/api/src/services/apiDispatchService.ts`
- `tools/check-type-surface.js`
- `docs/ops/local-verification.md`

## 実装方針

- `DsqlQueryExecutor` interface を追加し、SQL text と named params を渡す境界を定義する。
- まず read 系の `getMe`、`listChatSessions`、`listMessageEvents`、`listPublishedArtifacts` を明示的な SQL plan にする。
- executor 未設定時は `DSQL_EXECUTOR_NOT_BOUND` を返し、operation 未対応は `DSQL_OPERATION_NOT_MAPPED` を返す。
- UI/API response の fake data は生成しない。executor が返した rows だけを response body に写像する。
- 実 DSQL driver / IAM auth / connection pool は未実施として docs/report に残す。

## ドキュメント保守方針

- local verification docs に、DSQL repository が operation-level SQL plan と executor interface を持つこと、実 DSQL driver / IAM auth は未実施であることを追記する。

## 受け入れ条件

- `DsqlQueryExecutor` が SQL text と params を受け取る interface として定義されていること。
- `createDsqlApiRepository` が executor を受け取り、mapped operation を SQL plan 経由で実行すること。
- `getMe` / `listChatSessions` / `listMessageEvents` / `listPublishedArtifacts` の SQL plan が migration table 名と actor/tenant boundary を含むこと。
- executor 未設定と operation 未対応が別 error code で返ること。
- `createApiDispatchService` の dsql mode が `createDsqlApiRepository` を使うこと。
- source gate が上記 contract を検査すること。
- 実 Aurora DSQL 接続を完了扱いしないこと。

## 検証計画

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck`
- `npm run docs:check`
- `git diff --check`

## PR レビュー観点

- DSQL repository が fake response を生成していないこと。
- SQL plan に参加者/管理者境界が含まれていること。
- 実 DSQL 接続完了を過大に主張していないこと。

## リスク・制約

- 実 Aurora DSQL driver、IAM auth token、connection pool、transaction 管理は未実施。
- write operation の SQL mapping はこの slice では未対応。

## 検証結果

- `npm run typecheck -w @saphnexa/api`: 初回 fail。`exactOptionalPropertyTypes` により undefined optional property を渡していたため、未設定 property を渡さない形に修正。追加で `notFoundErrorCode` の union narrowing を明示型で修正後 pass。
- `git diff --check`: pass。
- `npm run docs:check`: pass。
- `npm run typecheck`: pass。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4570311584
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4570313249
