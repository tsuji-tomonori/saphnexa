# ADR-0001: ローカル縦断スライスを先に固定する

## 状態

accepted

## 背景

基本設計 v0.16 と検収 package v1.0 は、AWS dev/UAT 上の DSQL、S3、CloudFront、Cognito、AppSync Events、Bedrock KB、S3 Vectors、AgentCore、GitHub Actions、Allure 公開まで含む。
一方、`.workspace/local.md` はローカルでは業務ロジック・契約・UI・非同期制御を検証し、AWS マネージド実体は dev 環境で薄く検証する二段構えを推奨している。

## 決定

- 最初の実装単位は Node 標準機能だけで実行できる contract / local integration / static scan にする。
- Hono、React、CDK、Docusaurus、Allure、Flyway、AWS 実体を必要とする最終検収は、契約・ディレクトリ・trace・移行 SQL を先に固定した上で後続に分離する。
- 本番経路に demo fallback を混入させず、ローカル fixture は `createLocalStore` と `createFixtureRagAdapter` に閉じ込める。
- 検収 AC は PASS と未検証を混同せず、`docs/acceptance/traceability.md` に状態を残す。

## 根拠

- API 40 件と Tools API 6 件は contract metadata で件数・path・CSRF・error schema を検査できる。
- chat は `chat_sessions` と `chat_participants` に分離し、owner/viewer の認可差をローカル統合テストで確認できる。
- RAG fixture は KB retrieve、ACL check、reference expansion、evidence pack、citation format の Tools 境界を必ず通る。
- 軽量通知は event id/seq/detail URL のみとし、回答本文や chunk 本文を含めない。

## 設計差分

- Hono/Zod/OpenAPI 生成はまだ実依存を導入していない。代わりに contract metadata を正本の初期形として置いた。
- CDK は実 CDK construct ではなく、7 Construct 責務を inventory source として置いた。実 synth/deploy は未達。
- DSQL/Flyway は SQL migration を追加したが、DSQL 実接続と Flyway 実行は未検証。

## 影響

- ローカルで AC-013、AC-014、AC-031、AC-034、AC-040 から AC-043 の一部、AC-060 から AC-062 の一部、AC-073、AC-077、AC-080 の構造検査を進められる。
- AC-001、AC-002、AC-004、AC-020、AC-021、AC-047、AC-048、AC-080 の cdk synth 以降、AC-087、AC-088、AC-120 以降などは AWS/CI 証跡が必要で未完了のまま残す。
