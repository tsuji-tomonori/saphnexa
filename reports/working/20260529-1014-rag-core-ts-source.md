# RAG core TypeScript source 作業レポート

## 受けた指示

- `.workspace` の基本設計と `plan-20260529.txt` をもとに、TypeScript framework 実装をさらに進める。
- main を fetch してから作業する。
- 実 Bedrock / AgentCore Gateway / S3 Vectors 接続を未実施のまま完了扱いにしない。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | `packages/rag-core/src/fixture-rag.ts` が typed RAG adapter/tools boundary を export する | 対応 |
| R2 | RAG core TS source が実 `tsc` 対象に含まれる | 対応 |
| R3 | source gate が TS source と JS runtime mirror の主要 token 同期を確認する | 対応 |
| R4 | RAG security / quality 関連 checks が pass する | 対応 |
| R5 | 実 Bedrock / AgentCore Gateway / S3 Vectors 接続を完了扱いにしない | 対応 |

## 検討・判断の要約

- 既存 Node local tests は標準 `node` 実行で `.js` runtime mirror を使うため、JS は残した。
- TypeScript source には `LocalRagTools`、`RagEvidence`、`RagCitation`、`ToolInvocationStore` などの境界型を追加した。
- prompt injection refusal、ACL check、evidence pack、citation format の既存責務を TS source に反映した。
- source gate で TS source と JS runtime mirror の主要 tool/policy token を確認する形にした。

## 実施作業

- `packages/rag-core/src/fixture-rag.ts` を追加した。
- `packages/rag-core/tsconfig.json` と `tsconfig.typecheck.json` に TS source を含めた。
- `apps/tools-api/src/app.ts` で `ToolInvocationStore` 型を使うようにした。
- `tools/check-type-surface.js` に RAG core TS/source sync gate を追加した。
- `docs/ops/local-verification.md` に RAG core TS source と JS runtime mirror の扱いを追記した。

## 検証結果

- `npm run typecheck`: pass。
- `npm run rag:security:check`: pass。20/20 cases。
- `npm run rag:quality:check`: pass。recall@10=1.00、citation_precision=1.00、groundedness=1.00。
- `npm run test:contract`: pass。
- `npm test`: pass。15 tests。
- `npm run docs:check`: pass。
- `git diff --check`: pass。

## 成果物

| 成果物 | 内容 |
|---|---|
| `packages/rag-core/src/fixture-rag.ts` | typed RAG adapter/tools boundary |
| `packages/rag-core/tsconfig.json` | TS source include |
| `tools/check-type-surface.js` | RAG core TS/source sync gate |
| `docs/ops/local-verification.md` | RAG core TS source の検証範囲 |

## Fit 評価

総合fit: 4.5 / 5.0（約90%）

理由: plan の「RAG core はまだ `.js` 中心」という未達に対し、typed TS source と実 typecheck 対象化を追加した。既存 runtime mirror 廃止と実 AWS RAG 接続は未実施のため満点ではない。

## 未対応・制約・リスク

- `packages/rag-core/src/fixture-rag.js` は Node local tests 用 runtime mirror として残している。
- `.ts` source からの runtime artifact 生成は未実施。
- 実 Bedrock KB、S3 Vectors、AgentCore Gateway Target、Bedrock Evaluations は未接続・未実行。
