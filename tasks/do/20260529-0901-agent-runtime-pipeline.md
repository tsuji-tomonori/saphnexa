# Agent runtime pipeline

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-29 09:01 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` では、`apps/agent` が retrieval policy guard のみで、AgentCore Runtime 向け TypeScript Agent 実装としては不十分と判定されている。PR #3 で `/ping` / `/invocations` の TypeScript entry は追加したが、runtime handler、tool client、context packing、answer generation、citation binding の責務分離はまだ薄い。

## 目的

Agent 側を、RAG Tools 境界を活かした TypeScript pipeline 構造へ進める。実 AWS 接続は範囲外としつつ、AgentCore Runtime entry から deterministic pipeline を辿れる source-level 実装を追加する。

## スコープ

- `apps/agent/src/runtime/agentCoreHandler.ts` を追加する。
- `apps/agent/src/clients/` に Tools API、Bedrock Runtime、DSQL client の interface / default implementation 境界を追加する。
- `apps/agent/src/agent/` に query rewrite、context packing、answer generation、citation binding を追加する。
- `apps/agent/src/schemas/` に evidence / output schema を追加する。
- 既存 `createRagAgentRuntime` を pipeline 実行へ接続する。
- local/source gate と docs/report を更新する。

## 範囲外

- 実 AgentCore Runtime への deploy。
- 実 Bedrock KB / Bedrock Runtime / DSQL 接続。
- 外部 AWS state の変更。

## 実施計画

1. 現在の Agent entry と fixture RAG Tools 境界を確認する。
2. pipeline 用 schema / clients / agent modules / runtime handler を追加する。
3. `createRagAgentRuntime` を新 pipeline へ接続し、根拠不足時は拒否する。
4. `tools/check-type-surface.js` と docs を更新し、source gate が新 module 境界を確認する。
5. 関連検証を実行し、結果を作業レポートと PR コメントに記録する。

## ドキュメント保守方針

- runtime / RAG pipeline の source-level 境界が増えるため、`docs/ops/local-verification.md` に確認可能範囲と未完了範囲を追記する。
- 一時的な判断・検証結果は `reports/working/` に記録する。

## 受け入れ条件

- [ ] AgentCore invocation を扱う runtime handler がある。
- [ ] Tools API client 境界があり、kb retrieve、BM25、ACL、reference expand、evidence pack、citation format を型として扱う。
- [ ] Bedrock Runtime client 境界があり、LLM answer generation が pipeline 内の独立責務になっている。
- [ ] DSQL client 境界があり、ACL scope 解決が Agent 側の独立責務になっている。
- [ ] query rewrite、context packing、answer generation、citation binding が別 module になっている。
- [ ] evidence がない場合は answer generation に進まず refusal になる。
- [ ] citation は evidence / citation formatter の結果からのみ作る。
- [ ] retrieval policy guard が緩和されない。
- [ ] source gate と既存 RAG / contract tests が pass する。
- [ ] 実 AWS 接続や未実施検証を完了扱いにしない。

## 検証計画

- `npm run typecheck`
- `npm run test:contract`
- `npm test`
- `npm run rag:security:check`
- `npm run rag:quality:check`
- `git diff --check`

## PR レビュー観点

- RAG pipeline の責務分離。
- 不十分な evidence で plausible answer を返していないこと。
- citation が evidence 由来であること。
- retrieval policy / ACL scope が緩和されていないこと。
- 実 AWS 接続を実施済み扱いにしていないこと。

## リスク

- 実 Bedrock / DSQL / AgentCore 接続は未実施のため、今回の成果は source-level pipeline 境界と local gate までに留まる。
