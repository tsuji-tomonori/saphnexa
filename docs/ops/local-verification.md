# Local Verification

## 目的

`.workspace/local.md` の方針に合わせ、ローカルでは契約、認可、非同期 event、RAG Tools 境界、UI の相対 path 方針を検証する。

## コマンド

```bash
npm run test:contract
npm run test:integration:local
npm run scan:bundle-domains
npm run admin-artifacts:build
npm run artifacts:check
npm run coverage:check
npm run ui:check
npm run web:perf:local
npm run perf:api:local
npm run failure:check
npm run rag:quality:check
npm run rag:security:check
npm run rag:perf:local
npm run db:migration:check
npm run db:integrity:check
npm run search:local:check
npm run observability:check
npm test
git diff --check
```

## ローカルで確認できること

- 公開 API 38 件と Tools API 6 件の contract metadata。
- chat が独立リソースであり、owner/viewer によって操作権限が変わること。
- 質問送信が `message_id` / `run_id` を即時生成し、event detail を REST で取得できること。
- RAG が Tools API 境界を通り、ACL check 後の Evidence だけで citation を作ること。
- React source が `/api/*` と `/auth/*` の相対 path だけを使うこと。
- `dist/admin/docs/latest/` と `dist/admin/docs/versions/v0.16/` に docs artifact を生成できること。
- `dist/admin/test-reports/allure/latest/` に Allure 互換のローカル検証 report artifact を生成できること。
- admin artifact manifest の checksum、viewer path、source と、local API の admin 限定アクセス policy。
- Node test coverage が line 80% / branch 70% の threshold を満たすこと。
- UI source が共通 UI package を経由し、直書き style と基本 a11y 欠落を増やしていないこと。
- local non-AI API smoke が p95 800ms / error rate 1% 未満を満たすこと。
- retrieval、generation、worker notify の failure injection で failed 状態、error event、retryable が残ること。
- local RAG golden dataset で品質 metrics と参照展開が基準を満たすこと。
- prompt injection attack 20件で policy violation と tool invocation が発生しないこと。
- local RAG timing smoke で初回通知と最終回答の p95 が基準を満たすこと。
- Flyway versioned SQL migration の命名、schema_migrations、required tables、checksum、自動 migration 不採用。
- local DB-like store の主要ドメイン整合性と chat event append-only invariant。
- 参照グラフ sample 10/10 と BM25F golden recall@10 >= 0.80。
- required metrics 7/7、alarms 6/6、retention 未設定 0件の catalog。

## ローカルでは完了扱いにしないこと

- AWS dev/UAT での Cognito、DSQL、S3、CloudFront、AppSync Events、Bedrock KB、S3 Vectors、AgentCore の実接続。
- CDK deploy、CloudFormation outputs、S3 inventory、CloudWatch logs、CloudFront/S3/Docusaurus/Allure 公開 URL。
- axe/Playwright の実 DOM accessibility report、Lighthouse CI、本番 bundler の analyzer report、AWS load test。
- Bedrock KB、S3 Vectors、AgentCore Runtime、Bedrock Evaluations を使った実 RAG 品質評価。
- Aurora DSQL への Flyway 実適用、CloudWatch metrics/alarms、S3 lifecycle、DSQL retention settings の実リソース確認。
- Git tag、GitHub release、検収用 `evidence_manifest.json` の最終確定。
