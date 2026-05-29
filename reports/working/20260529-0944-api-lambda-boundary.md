# API Lambda boundary 作業レポート

## 受けた指示

- `.workspace` の基本設計と `plan-20260529.txt` をもとに、TypeScript framework 実装をさらに進める。
- main を fetch してから作業する。
- 完了条件を満たすまで完了扱いにせず、検証と PR コメントを残す。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | `apps/api` に Hono AWS Lambda handler entrypoint を追加する | 対応 |
| R2 | API middleware 境界を TypeScript source として追加する | 対応 |
| R3 | API service/repository adapter 境界を TypeScript source として追加する | 対応 |
| R4 | 既存 local API behavior / OpenAPI checks を破壊しない | 対応 |
| R5 | 実 DSQL/Cognito/AWS deploy を完了扱いにしない | 対応 |

## 検討・判断の要約

- `origin/main` を fetch し、PR branch が main から遅れていないことを確認した。
- 既存の contract-driven Hono app factory と local fixture behavior は維持し、その外側へ Lambda handler と middleware/service/repository 境界を追加した。
- 実 DSQL 接続は未実施のため、`DsqlApiRepository` interface と unbound repository placeholder に留めた。
- CSRF は既存 local dispatcher の enforcement を維持しつつ、Hono middleware 側にも state-changing route の header boundary を追加した。
- Cognito session 検証は未実施のため、session middleware は actor header 境界の source-level placeholder として追加した。

## 実施作業

- `apps/api/src/index.ts` に `hono/aws-lambda` の `handler` export を追加した。
- `apps/api/src/middleware/` に error、origin、request-log、session、csrf middleware を追加した。
- `apps/api/src/services/apiDispatchService.ts` に environment-based dispatch service factory を追加した。
- `apps/api/src/repositories/dsql/apiRepository.ts` に DSQL repository interface と unbound implementation を追加した。
- `apps/api/src/app.ts` と `apps/api/src/hono-openapi-app.ts` を新しい境界に接続した。
- `tools/check-type-surface.js` と `docs/ops/local-verification.md` を更新した。

## 検証結果

- `npm run typecheck`: pass。
- `npm run api:openapi:check`: pass。
- `npm run test:contract`: pass。
- `npm run test:integration:local`: pass。
- `npm test`: pass。15 tests。
- `npm run docs:check`: pass。
- `git diff --check`: pass。

## 成果物

| 成果物 | 内容 |
|---|---|
| `apps/api/src/index.ts` | Hono AWS Lambda handler entrypoint |
| `apps/api/src/middleware/*.ts` | API middleware boundary |
| `apps/api/src/services/apiDispatchService.ts` | dispatch service factory |
| `apps/api/src/repositories/dsql/apiRepository.ts` | DSQL repository interface |
| `docs/ops/local-verification.md` | 検証範囲と未実施 AWS 接続の明記 |

## Fit 評価

総合fit: 4.4 / 5.0（約88%）

理由: plan の「Hono backend を TypeScript framework 実装へ昇格する」方向に対し、Lambda handler と middleware/service/repository 境界を追加した。実 DSQL/Cognito/AWS 起動は未実施であり、runtime bundle 生成も未確認のため満点ではない。

## 未対応・制約・リスク

- Aurora DSQL への実接続、Cognito session/JWT 検証、CloudFront 経由の HTTP request は未実施。
- `apps/api/src/index.ts` は TypeScript source として typecheck 済みだが、Lambda bundle 生成と AWS 上の起動確認は未実施。
- session middleware は actor header 境界の placeholder であり、本番の cookie/JWT 検証ではない。
