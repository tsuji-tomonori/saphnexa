# Agent invocation validation boundary

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-29 12:33 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- 参照:
  - `/home/t-tsuji/project/saphnexa/.workspace/plan-20260529.txt`
  - `/home/t-tsuji/project/saphnexa/.workspace/Saphnexa_基本設計書_v0.17_package.zip`

## 背景

`plan-20260529.txt` では `apps/agent` が AgentCore Runtime 向け TypeScript Agent 実装として未達であることが課題として整理されている。
現状は TypeScript の `app.ts` / `agentCoreHandler.ts` / RAG pipeline 境界が追加されているが、`/invocations` の runtime 例外や runtime output schema drift を標準的な JSON error / failed result へ閉じ込める契約が弱い。

## 目的

AgentCore Runtime 互換の `/invocations` handler を、入力 validation、出力 validation、runtime 例外 containment の観点で強化する。
実 Bedrock / AgentCore Gateway / Aurora DSQL 接続の完了ではなく、TypeScript runtime boundary の安全性を一段進める。

## スコープ

- `apps/agent/src/runtime/agentCoreHandler.ts`
- `apps/agent/src/schemas/invocation.ts`
- `apps/agent/src/app.ts`
- `tools/check-type-surface.js`
- `docs/ops/local-verification.md`

## 実装方針

- invalid invocation payload は既存通り `400 INVALID_INVOCATION` とする。
- runtime が throw した場合は、未処理例外を外へ漏らさず `500` と `status: "failed"` の invocation result に写像する。
- runtime が schema 外の result を返した場合は、`500 INVALID_INVOCATION_RESULT` として標準 error body にする。
- `/invocations` は handler の返す status を Hono response status として使い、`202` 固定 cast へ寄せない。
- source gate で runtime exception / output validation / failed result mapping を検査する。

## ドキュメント保守方針

- local verification docs に、Agent runtime boundary が source/typecheck で検査されること、実 AgentCore Runtime 起動は未検証であることを明記する。

## 受け入れ条件

- `AgentInvocationResultSchema` が runtime output validation に使われていること。
- runtime throw が `status: "failed"` の invocation result と HTTP 500 に写像されること。
- invalid runtime output が `INVALID_INVOCATION_RESULT` の standard error と HTTP 500 に写像されること。
- `/invocations` が handler の status を response status として返すこと。
- source gate が上記 contract を検査すること。
- 実 Bedrock / AgentCore Gateway / Aurora DSQL 接続を完了扱いしないこと。

## 検証計画

- `npm run typecheck -w @saphnexa/agent`
- `npm run typecheck`
- `npm run docs:check`
- `git diff --check`

## PR レビュー観点

- Agent runtime の未処理例外が外へ漏れないこと。
- schema 外 output を成功扱いしないこと。
- 実 AWS runtime 検証を過大に完了扱いしていないこと。

## リスク・制約

- この slice は TypeScript source / local typecheck / source gate での契約強化に限定する。
- 実 AgentCore Runtime `/invocations` の AWS 上の HTTP 実行は未実施。

## 検証結果

- `npm run typecheck -w @saphnexa/agent`: 初回 fail。`agentCoreHandler.ts` に旧 return ブロックが残っていたため削除後 pass。
- `git diff --check`: pass。
- `npm run docs:check`: pass。
- `npm run typecheck`: pass。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4570253991
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4570255316
