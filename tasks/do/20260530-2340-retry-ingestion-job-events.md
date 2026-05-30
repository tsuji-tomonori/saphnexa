# Retry ingestion job events slice

- 状態: doing
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 23:40 JST
- タスク種別: 機能追加

## 背景

`retryIngestionJob` は DSQL mapping 自体は存在するが、coverage manifest 上では `domainEvent: planned` / `audit: planned` が残っている。
local store は retry 時に `document.ingestion.retried` audit event を記録し、DB lifecycle docs は `ingestion_jobs` の状態を `ingestion_job_events` projection として扱う。

## 目的

`retryIngestionJob` の DSQL query plan に `ingestion_job_events` と `audit_events` の append を追加し、API production planned marker を 9 件から 8 件へ減らす。

## 対象 API

- `retryIngestionJob`

## 実施計画

1. 既存 DSQL mapping、local store、`ingestion_job_events` schema を確認する。
2. `retryIngestionJob` に `ingestion_job_events` append を追加する。
3. `retryIngestionJob` に `document.ingestion.retried` audit append を追加する。
4. `packages/api-contract/src/implementation-coverage.ts` の対象 API から planned marker を外す。
5. generated coverage mirror を再生成し、検証を実行する。
6. 作業レポート、commit / push、PR コメント、CI 確認、task done 移動まで実施する。

## ドキュメントメンテナンス計画

- API shape、route、permission、OpenAPI schema は変更しないため durable docs の更新は不要と判断する。
- `docs/generated/db/lifecycle.md` は既に ingestion job event projection 前提を記載しているため、今回は実装を既存 docs に合わせる。
- 一時的な作業記録は task md と `reports/working/` に残す。

## 受け入れ条件

- [ ] `retryIngestionJob` の DSQL query plan が `ingestion_job_events` に domain event を append する。
- [ ] `retryIngestionJob` の DSQL query plan が `audit_events` に `document.ingestion.retried` を append する。
- [ ] 既存 admin actor / tenant / failed job 境界を弱めない。
- [ ] response shape が `{ job }` を維持する。
- [ ] `packages/api-contract/src/implementation-coverage.ts` 上で `retryIngestionJob` に planned marker が残らない。
- [ ] generated coverage mirror が更新される。
- [ ] `npm run implementation-coverage:generate` が成功する。
- [ ] `npm run implementation-coverage:check` が成功する。
- [ ] `npm run api:implementation:check` が成功し、planned marker 数が 8 件になる。
- [ ] `npm run api:implementation:check:production` の失敗リストから `retryIngestionJob` が消える。
- [ ] `npm run test:integration:local` が成功する。
- [ ] `npm run web:flow:check` が成功する。
- [ ] `npm run typecheck:source` が成功する。
- [ ] `npm run check:static` が成功する。
- [ ] `git diff --check` が成功する。
- [ ] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- [ ] GitHub Actions の PR check が成功する。

## PR レビュー観点

- event append が retry 対象 job と同一 tenant / job_id に限定されていること。
- audit payload が document / version を含み local store と整合すること。
- projection 直接 update は既存互換として残しつつ、event append を追加していることを過大評価しないこと。

## リスク

- 完全な projector 化ではなく、既存 projection update に domain event append を追加する scope に限定する。
