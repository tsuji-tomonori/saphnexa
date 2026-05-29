# API Lambda boundary

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-29 09:42 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` では、Hono backend は Hono + Zod OpenAPI の骨格から、TypeScript framework 実装、Lambda adapter、middleware、repository/service 境界へ進める必要があるとされている。現状は `createSaphnexaApiApp` と OpenAPI app factory はあるが、AWS Lambda entrypoint と本番向け境界の TypeScript source が不足している。

## 目的

`apps/api` を Hono app factory から AWS Lambda handler まで接続できる TypeScript API framework 実装へ進める。

## スコープ

- `apps/api/src/index.ts` に Hono AWS Lambda handler entrypoint を追加する。
- request log / origin / error / session / CSRF の middleware 境界を TypeScript source として追加する。
- API request dispatch を service/repository adapter 境界へ分け、DSQL repository interface を定義する。
- 既存 local dispatcher を repository/service 境界から利用できるようにする。
- source gate / docs / report を更新する。

## 範囲外

- Aurora DSQL への実接続、migration 実適用。
- Cognito JWT/session cookie の暗号検証実装。
- Lambda bundle 生成、デプロイ、AWS dev/UAT 実行。

## 実施計画

1. 現行 API dispatch と Hono app factory の責務を確認する。
2. Lambda entrypoint、middleware、repository/service 境界を追加する。
3. `npm run typecheck` と API 関連 checks を実行する。
4. docs/report/PR コメント/task done を更新する。

## ドキュメント保守方針

- `docs/ops/local-verification.md` に Lambda handler boundary と未実施 AWS 接続を追記する。
- 作業結果と制約を `reports/working/` に記録する。

## 受け入れ条件

- [ ] `apps/api/src/index.ts` が Hono AWS Lambda handler を export する。
- [ ] API middleware 境界が TypeScript source として存在する。
- [ ] API service/repository adapter 境界が TypeScript source として存在する。
- [ ] 既存 local API behavior と OpenAPI checks が破壊されない。
- [ ] 実 DSQL/Cognito/AWS deploy を完了扱いにしない。

## 検証計画

- `npm run typecheck`
- `npm run api:openapi:check`
- `npm run test:contract`
- `npm run test:integration:local`
- `npm test`
- `npm run docs:check`
- `git diff --check`

## PR レビュー観点

- Lambda entrypoint が Hono app factory を再利用し、route contract と schema 生成を二重化していないこと。
- middleware/service/repository 境界が認可・CSRF・RAG evidence 境界を弱めていないこと。
- 実 AWS 接続未実施を docs/report/PR で正直に扱うこと。

## リスク

- Hono AWS Lambda adapter 型と dynamic OpenAPI route 登録の型推論が噛み合わない可能性がある。
- 境界追加だけで実 DSQL 接続を実装済みと誤読される可能性があるため、未実施範囲を明記する。
