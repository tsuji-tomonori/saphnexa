# Tools API contract runtime boundary 作業レポート

## 受けた指示

- `.workspace/plan-20260529.txt` と `.workspace/Saphnexa_基本設計書_v0.17_package.zip` を前提に、TypeScript framework 実装の未達項目を進める。
- 作業前に `main` を更新する。
- Repository workflow に従い、task md、検証、commit/PR 更新、PR コメント、作業レポートを残す。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | Tools API 6 件の request/response schema を明確にする | 対応 |
| R2 | invalid request と handler response drift を HTTP status で分離する | 対応 |
| R3 | Agent が Tools API HTTP endpoint を呼べる client 境界を持つ | 対応 |
| R4 | source gate と docs を同期する | 対応 |
| R5 | 実 AWS 接続を実施済み扱いしない | 対応 |

## 検討・判断の要約

- `plan-20260529.txt` の未達項目のうち、今回は Agent と Tools API の境界を進める小さな feature slice とした。
- Tools API は既に Hono/OpenAPI の骨格を持っていたため、新規アプリ追加ではなく既存 `apps/tools-api/src/app.ts` に operationId ごとの Zod schema map を追加した。
- Agent 側は runtime pipeline の責務を維持しつつ、`toolContracts` の path を使う HTTP client factory を追加した。
- 実 AgentCore Gateway 認可、Bedrock KB Retrieve、DSQL ACL query は AWS dev/UAT 接続が必要なため、今回は source-level 境界までとした。
- Security review として、Tools API は AgentCore Gateway outbound 前提の内部 tool endpoint であり、今回 public user route は追加していない。認可は Gateway/IAM 側の残課題として docs と PR コメントに明記する。

## 実施作業

- `apps/tools-api/src/app.ts`
  - 6 operation の request/response Zod schema を追加。
  - OpenAPI route の body/200 response schema を operationId ごとの schema に変更。
  - invalid JSON / invalid request を `TOOL_REQUEST_INVALID` の 400 に分離。
  - handler response が schema 外の場合を `TOOL_RESPONSE_INVALID` の 500 に分離。
- `apps/agent/src/clients/toolsApiClient.ts`
  - `createHttpToolsApiClient`、`HttpToolsApiClientOptions`、`ToolsApiHttpError` を追加。
  - `toolContracts` の operationId/path を使い、6 operation を HTTP POST できる境界を追加。
- `apps/agent/package.json`、`apps/tools-api/package.json`、`package-lock.json`
  - workspace 依存を明示。
- `apps/tools-api/tsconfig.json`
  - workspace source import を含めて targeted typecheck できるよう調整。
- `tools/check-type-surface.js`
  - Tools API schema、400/500 分離、Agent HTTP client 境界の source gate を追加。
- `docs/ops/local-verification.md`
  - source-level で確認できる Tools API/Agent 境界と、AWS dev/UAT で別途必要な実接続確認を追記。
- `tasks/do/20260529-1253-tools-api-contract-runtime-boundary.md`
  - 受け入れ条件と検証計画を事前作成。

## 成果物

| 成果物 | 内容 |
|---|---|
| `apps/tools-api/src/app.ts` | Tools API 6 件の Zod 入出力検証と 400/500 分離 |
| `apps/agent/src/clients/toolsApiClient.ts` | Agent 用 Tools API HTTP client 境界 |
| `tools/check-type-surface.js` | source gate 追加 |
| `docs/ops/local-verification.md` | ローカル検証範囲と AWS 未検証範囲の更新 |
| `tasks/do/20260529-1253-tools-api-contract-runtime-boundary.md` | 作業 task md |

## 実行した検証

- `npm install --package-lock-only`: pass。workspace 依存追加に伴う lockfile 同期。
- `npm run typecheck -w @saphnexa/tools-api`: 初回は workspace source import が `rootDir` 外で fail。`apps/tools-api/tsconfig.json` を調整後 pass。
- `npm run typecheck -w @saphnexa/agent`: pass。
- `npm run typecheck:source`: pass。
- `npm run typecheck`: pass。
- `npm run docs:check`: pass。
- `npm run test:contract`: pass。
- `git diff --check`: pass。

## 未実施・制約・リスク

- `./node_modules/.bin/tsx --eval ...` による direct runtime smoke は、この worktree に `node_modules/.bin/tsx` が存在しないため実行できなかった。
- 実 AgentCore Gateway 認可、実 Bedrock KB Retrieve、実 DSQL ACL query、実 HTTP logs による結合確認は未実施。AWS dev/UAT 検証で確認する。
- 今回の Tools API は local tools handler を schema で包む段階であり、外部公開 authorizer や IAM policy は変更していない。

## 指示への fit 評価

総合fit: 4.3 / 5.0（約86%）

理由: plan の未達項目である Tools API / Agent HTTP 境界を TypeScript source と検証 gate に進め、docs と未検証範囲も同期した。一方、実 AWS Gateway/Bedrock/DSQL 接続と direct runtime smoke は未実施のため満点ではない。
