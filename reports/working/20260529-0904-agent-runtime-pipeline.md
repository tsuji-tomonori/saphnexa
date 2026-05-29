# Agent runtime pipeline 作業レポート

## 指示

- `.workspace/plan-20260529.txt` と基本設計 v0.17 package を根拠に、plan の内容を継続して進める。
- PR #3 の後続として、AgentCore Runtime 向け TypeScript Agent 実装の不足分を進める。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | AgentCore invocation を扱う runtime handler を追加する | 対応 |
| R2 | Tools API / Bedrock Runtime / DSQL client 境界を追加する | 対応 |
| R3 | query rewrite / context packing / answer generation / citation binding を分離する | 対応 |
| R4 | evidence 不足時に refusal し、根拠なし回答へ進まない | 対応 |
| R5 | citation を evidence / citation formatter 由来に限定する | 対応 |
| R6 | retrieval policy / ACL scope を緩和しない | 対応 |
| R7 | 実 AWS 接続を実施済み扱いにしない | 対応 |

## 検討・判断

- PR #3 で `/ping` / `/invocations` の entry は追加済みだったが、Agent 本体の処理は refusal 中心で pipeline の責務が薄かった。
- 今回は実 AWS 接続に進まず、source-level で実 runtime へ差し替え可能な interface と deterministic pipeline を追加した。
- default client は未設定時に空 evidence を返し、回答生成へ進まず refusal する。これにより、未接続 runtime がもっともらしい回答や fake citation を返さない。
- DSQL client は現時点では invocation policy の scope をそのまま返す default に留め、scope 拡張は `assertRetrievalPolicyNotRelaxed` で拒否する。

## 実施作業

- `apps/agent/src/runtime/agentCoreHandler.ts` を追加。
- `apps/agent/src/clients/toolsApiClient.ts`、`bedrockRuntimeClient.ts`、`dsqlClient.ts` を追加。
- `apps/agent/src/agent/queryRewrite.ts`、`contextPacking.ts`、`answerGeneration.ts`、`citationBinding.ts` を追加。
- `apps/agent/src/schemas/evidence.ts`、`output.ts` を追加。
- `createRagAgentRuntime` を query rewrite、retrieval、ACL、reference expand、evidence pack、context packing、answer generation、citation binding の順に接続。
- `tools/check-type-surface.js` と `docs/ops/local-verification.md` を更新。

## 成果物

| 成果物 | 内容 |
|---|---|
| `apps/agent/src/runtime/agentCoreHandler.ts` | AgentCore invocation handler |
| `apps/agent/src/clients/*` | Tools API / Bedrock / DSQL client interface |
| `apps/agent/src/agent/*` | RAG pipeline modules |
| `apps/agent/src/schemas/*` | invocation / evidence / output schema |
| `tools/check-type-surface.js` | Agent pipeline source gate |
| `docs/ops/local-verification.md` | local verification docs update |

## 実行した検証

- `npm run typecheck`: pass
- `npm run test:contract`: pass
- `npm test`: pass
- `npm run rag:security:check`: pass
- `npm run rag:quality:check`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass

## 未対応・制約・リスク

- 実 Bedrock Runtime 生成、AgentCore Gateway Target 経由 Tools API 呼び出し、Aurora DSQL ACL query は未実施。
- `tsc` 実体はこの環境に未導入のため、今回の `npm run typecheck` は repository の type surface source gate。
- Runtime interface は追加したが、実 AWS 接続に必要な credentials、endpoint、retry、timeout、observability wiring は後続作業。

## Fit 評価

総合fit: 4.3 / 5.0（約86%）

理由: plan の Agent runtime 不足に対して、責務分離と source gate は前進した。実 Bedrock / DSQL / AgentCore 接続と実 TypeScript compilation は未実施のため満点ではない。
