# Tools API contract runtime boundary

## 背景

`plan-20260529.txt` では、Agent が Tools API 経由で KB 検索、BM25 検索、ACL 確認、参照展開、Evidence 整形、引用整形を実行する TypeScript 実装が未達として示されている。
現状の `apps/tools-api` は TypeScript Hono API の骨格を持つが、request/response schema が `unknown` に近く、Agent 側にも実 HTTP/Gateway 経由で Tools API を呼ぶ client 境界が不足している。

## 目的

Tools API 6 件の契約を TypeScript/Zod の runtime validation として明確化し、Agent runtime が Tools API HTTP endpoint へ接続できる境界を追加する。

## タスク種別

機能追加

## スコープ

- `apps/tools-api` の 6 tool route に request/response schema validation を追加する。
- `apps/agent` に Tools API HTTP client を追加し、契約 path と operationId に沿って呼び出す。
- source-level gate と運用 docs に、今回追加する境界を反映する。
- 実 AWS AgentCore Gateway / Bedrock KB / DSQL 実接続は今回の対象外とし、未検証として明記する。

## 実装計画

1. Tools API 6 件の request/response schema を Zod で定義する。
2. `toolContracts` の operationId ごとに schema と handler を対応付け、400/500 を分離する。
3. Agent 用 `createHttpToolsApiClient` を追加し、fetch/timeout/HTTP error を明示する。
4. source surface check と `docs/ops/local-verification.md` を更新する。
5. 対象 typecheck、source check、docs check、diff check を実行する。

## ドキュメントメンテナンス計画

Tools API と Agent 境界の検証範囲が変わるため、`docs/ops/local-verification.md` に source-level で確認できることと、未検証の AWS 実接続範囲を追記する。

## 受け入れ条件

- [x] Tools API の 6 operation が request schema と response schema を持ち、invalid request を 400 として返す。
- [x] handler の response が schema 外の場合、Tools API が 500 として返す。
- [x] Agent 側に Tools API HTTP endpoint 用 client があり、6 operation を `toolContracts` の path で呼び出せる。
- [x] source gate が Tools API schema/client 境界を検査する。
- [x] 関連 docs が、今回確認済みの source-level 境界と未確認の AWS 実接続範囲を区別している。
- [x] 選定した検証コマンドが pass し、未実施の実 AWS 検証を実施済み扱いしていない。

## 検証計画

- `npm run typecheck -w @saphnexa/tools-api`
- `npm run typecheck -w @saphnexa/agent`
- `npm run typecheck`
- `npm run docs:check`
- `git diff --check`

## PR レビュー観点

- Tools API の request/response schema が契約 6 件を漏れなく覆うこと。
- Agent が直接 fixture に依存する経路だけでなく、HTTP/Gateway 境界を持つこと。
- RAG の ACL 境界と citation binding を弱めていないこと。
- AWS 実接続未検証の範囲を PR コメントとレポートで明示すること。

## リスク

- `@hono/zod-openapi` の型制約により、schema mapping の型を過度に複雑化すると typecheck の保守性が落ちる。
- 実 HTTP endpoint の認証は AgentCore Gateway 側の責務として残るため、今回の client は source-level 接続境界に留まる。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4570405198
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4570412752

## 状態

done
