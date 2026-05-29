# Admin 取り込みジョブ進捗 percentage 境界

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-29 20:37
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: #3

## 背景

Admin 取り込みジョブ確認は `getIngestionJob` / `retryIngestionJob` route helper と retryable state までは source/local gate で確認済みだが、`docs/ops/local-verification.md` では進捗 percentage が未接続として残っている。既存 job response に状態由来の progress を追加すれば、新規 public route を増やさず確認境界を前進できる。

## 目的

取り込みジョブの `status` から算出される `progress_percent` を API schema / local store / DSQL source plan / Web UI に追加し、Admin 取り込みジョブ確認 panel で表示する。実 Step Functions 実行、実 S3 raw/parsed 配置、Bedrock KB / S3 Vectors ingestion、job 一覧 API は未接続として残す。

## スコープ

- local store の ingestion job response
- DSQL repository `getIngestionJob` / `retryIngestionJob` query plan
- OpenAPI/Zod schema、generated API client operation types
- Web `IngestionJobPanel` / `IngestionJob` type
- source/local/UI/a11y/docs gates

## 対象外

- Public API route 追加
- job 一覧 API
- 実 Step Functions 実行
- 実 S3 raw/parsed 配置
- Bedrock KB / S3 Vectors ingestion
- 実ブラウザ E2E
- 実 Aurora DSQL SQL 実行

## 受け入れ条件

- [x] `getIngestionJob` / `retryIngestionJob` response が `progress_percent` を返す。
- [x] failed job は `progress_percent: 0`、queued job は `progress_percent: 10`、succeeded job は `progress_percent: 100` として扱う。
- [x] Web の取り込みジョブ確認 panel が API 由来の進捗 percentage を表示する。
- [x] general user は progress 付き ingestion job を取得・retry できない。
- [x] DSQL source plan でも status 由来の `progress_percent` を返す。
- [x] docs/source/UI/a11y gates 上で進捗 percentage は接続済みになり、実 Step Functions / S3 / KB ingestion と job 一覧 API は未接続として残る。
- [x] 選定した検証コマンドが pass する。

## 実装計画

1. ingestion job schema/type に `progress_percent` を追加する。
2. local store で job 作成・retry 時に状態由来の progress を付与する。
3. DSQL `getIngestionJob` / `retryIngestionJob` plan で status 由来の progress を select する。
4. Web `IngestionJobPanel` に進捗 percentage を表示する。
5. local/source/UI/a11y/docs gates と検証を更新する。

## ドキュメントメンテナンス計画

- `docs/ops/local-verification.md` の Admin 取り込みジョブ確認項目を、進捗 percentage が local/source gate 接続済みである状態へ更新する。
- 実 Step Functions / S3 / KB ingestion、job 一覧 API は未接続として残す。

## 検証計画

- `npm run typecheck -w @saphnexa/api`
- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck:source`
- `npm run api-client:operation-types:check`
- `npm run api:openapi:check`
- `npm run web:flow:check`
- `npm run ui:check`
- `npm run web:a11y:check`
- `npm run test:integration:local`
- `npm test`
- `npm run docs:check`
- `npm run test:contract`
- `npm run web:build:check`
- `git diff --check`

## PR セルフレビュー観点

- progress 値が fake business data ではなく API/store/DSQL response 由来であること。
- general user が ingestion job の progress を取得できないこと。
- OpenAPI / Zod / generated client / Web type が同期していること。
- 未接続の実 Step Functions / S3 / KB ingestion を完了扱いしていないこと。

## 完了メモ

- 実装 commit: `69bdffa`
- 作業レポート: `reports/working/20260529-2037-admin-ingestion-progress.md`
- PR 受け入れ条件コメント: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4574548927
- PR セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4574555498
- 検証:
  - `npm run api-client:operation-types:check`: pass
  - `npm run api:openapi:check`: pass
  - `npm run typecheck -w @saphnexa/api`: pass
  - `npm run typecheck -w @saphnexa/web`: pass
  - `npm run typecheck:source`: pass
  - `npm run test:integration:local`: pass
  - `npm run web:flow:check`: pass
  - `npm run ui:check`: pass
  - `npm run web:a11y:check`: pass
  - `npm run admin:workflow:check`: pass
  - `npm test`: pass
  - `npm run docs:check`: pass
  - `npm run test:contract`: pass
  - `npm run web:build:check`: pass。Vite の 500 kB chunk warning は出た。
  - `git diff --check`: pass
