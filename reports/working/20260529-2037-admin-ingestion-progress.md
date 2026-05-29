# Admin 取り込みジョブ進捗 percentage 境界 作業完了レポート

## 受けた指示
- `main` を pull/fetch してから作業する。
- `.workspace/plan-20260529.txt` と基本設計をもとに、未接続の TypeScript framework / Admin UI 境界を前進させる。
- リポジトリルールに従い、task md、検証、PR コメント、作業レポートを残す。

## 要件整理
- 既存 `getIngestionJob` / `retryIngestionJob` response に `progress_percent` を追加する。
- failed / queued / succeeded の代表状態で進捗 percentage を確認する。
- Web の取り込みジョブ確認 panel は API 由来の進捗 percentage を表示する。
- general user が取り込みジョブの progress を取得・retry できないことを維持する。
- docs/source/UI/a11y/local gate を進捗 percentage の接続済み状態へ同期する。

## 検討・判断
- 新規 route は追加せず、既存 ingestion job response に status 由来の `progress_percent` を追加した。
- progress は UI 側の固定表示ではなく、local store と DSQL source plan の response 値として返す形にした。
- 実 Step Functions 実行、実 S3 raw/parsed 配置、Bedrock KB / S3 Vectors ingestion、job 一覧 API は今回未接続のまま docs に残した。

## 実施作業
- local store の ingestion job 作成・取得・retry・文書詳細内 job に `progress_percent` を付与した。
- DSQL `getIngestionJob` / `retryIngestionJob` plan に status 由来の `progress_percent` を追加した。
- OpenAPI/Zod schema と generated API client operation types を同期した。
- Web `IngestionJob` type と `IngestionJobPanel` に進捗 percentage 表示を追加した。
- integration/local flow、admin workflow、web flow source gate、UI quality、a11y、type surface gate を更新した。
- `docs/ops/local-verification.md` の Admin 取り込みジョブ確認項目を進捗 percentage の接続済み状態へ更新した。

## 成果物
- `packages/domain/src/store.js`
- `packages/domain/src/store-types.ts`
- `apps/api/src/repositories/dsql/apiRepository.ts`
- `apps/api/src/openapi-document.ts`
- `apps/api/src/openapi-document.js`
- `apps/api/src/zod-openapi-schemas.ts`
- `apps/api/src/zod-openapi-schemas.js`
- `packages/api-client/src/generated/operation-types.ts`
- `apps/web/src/types.ts`
- `apps/web/src/features/admin/IngestionJobPanel.tsx`
- `tests/integration-local.test.js`
- `tools/check-admin-workflows.js`
- `tools/check-web-flows.js`
- `tools/check-ui-quality.js`
- `tools/check-web-accessibility-report.js`
- `tools/check-type-surface.js`
- `docs/ops/local-verification.md`
- `tasks/do/20260529-2037-admin-ingestion-progress.md`

## 検証
- `git fetch origin main`: 実施済み。
- `git rev-list --left-right --count origin/main...HEAD`: 作業開始時 `0 127`。
- `npm run api-client:operation-types:check`: pass。
- `npm run api:openapi:check`: pass。
- `npm run typecheck -w @saphnexa/api`: pass。
- `npm run typecheck -w @saphnexa/web`: pass。
- `npm run typecheck:source`: pass。
- `npm run test:integration:local`: pass。
- `npm run web:flow:check`: pass。
- `npm run ui:check`: pass。
- `npm run web:a11y:check`: pass。
- `npm run admin:workflow:check`: pass。
- `npm test`: pass。
- `npm run docs:check`: pass。
- `npm run test:contract`: pass。
- `npm run web:build:check`: pass。Vite の 500 kB chunk warning は出たが、build と output check は pass。
- `git diff --check`: pass。

## 指示への fit 評価
- main fetch 後に専用 worktree 上で作業し、元 worktree の変更は混ぜていない。
- task md に受け入れ条件を置いたうえで、実装、検証、レポート作成まで進めた。
- Admin 取り込みジョブの進捗 percentage は plan/docs に残っていた未接続項目を、既存 route 契約を増やさず前進させている。

## 未対応・制約・リスク
- 実 Step Functions 実行は未実施。
- 実 S3 raw/parsed 配置は未実施。
- Bedrock KB / S3 Vectors ingestion は未実施。
- job 一覧 API は未実装。
- 実ブラウザ E2E と実 Aurora DSQL SQL 実行は未実施。
- `web:build:check` では既存の Vite chunk size warning が出ている。
