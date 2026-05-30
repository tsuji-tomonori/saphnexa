# Get user import DSQL coverage slice

- 状態: done
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 19:01 JST
- 完了: 2026-05-30 19:06 JST
- タスク種別: 機能追加

## 背景

`getUserImport` は coverage manifest 上で production が `planned` のまま残っている。
local API は admin actor のみ `user_import_jobs` と `user_import_rows` を返しており、DSQL repository には同等の読み取り mapping がまだ存在しない。

## 目的

`getUserImport` の DSQL query plan を追加し、管理者ロール境界と tenant 境界を維持したまま API production planned marker を 11 件から 10 件へ減らす。

## 対象 API

- `getUserImport`

## 実施計画

1. `user_import_jobs` / `user_import_rows` schema と local API response shape を確認する。
2. `apps/api/src/repositories/dsql/apiRepository.ts` に `getUserImport` mapping を追加する。
3. `packages/api-contract/src/implementation-coverage.ts` の `getUserImport` を implemented 相当に更新する。
4. generated coverage mirror を再生成し、検証を実行する。
5. 作業レポート、commit / push、PR コメント、CI 確認、task done 移動まで実施する。

## ドキュメントメンテナンス計画

- API shape、route、permission、OpenAPI schema は変更しないため durable docs の更新は不要と判断する。
- DSQL mapping の追加は既存 local API / generated DB docs の前提に合わせる。
- 一時的な作業記録は task md と `reports/working/` に残す。

## 受け入れ条件

- [x] `getUserImport` の DSQL query plan が追加される。
- [x] query plan が active admin actor と同一 tenant の import job / rows に限定される。
- [x] response shape が `{ import, rows }` を維持する。
- [x] `packages/api-contract/src/implementation-coverage.ts` 上で `getUserImport` に planned marker が残らない。
- [x] generated coverage mirror が更新される。
- [x] `npm run implementation-coverage:generate` が成功する。
- [x] `npm run implementation-coverage:check` が成功する。
- [x] `npm run api:implementation:check` が成功し、planned marker 数が 10 件になる。
- [x] `npm run api:implementation:check:production` の失敗リストから `getUserImport` が消える。
- [x] `npm run test:integration:local` が成功する。
- [x] `npm run web:flow:check` が成功する。
- [x] `npm run typecheck:source` が成功する。
- [x] `npm run check:static` が成功する。
- [x] `git diff --check` が成功する。
- [x] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- [x] GitHub Actions の PR check が成功する。

## 実施結果

- 実装 commit: `7b561a5`
- 作業レポート: `reports/working/20260530-1901-get-user-import-dsql-coverage.md`
- PR 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582503535
- PR セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582504659
- GitHub Actions: `gh pr checks 6 --watch --interval 10` で pass を確認。

## 検証結果

- `npm run implementation-coverage:generate`: pass
- `npm run implementation-coverage:check`: pass
- `npm run api:implementation:check`: pass（40 operations, 10 planned markers）
- `npm run api:implementation:check:production`: expected fail。失敗リストは `submitQuestion`, `startUserImport`, `createDocument`, `createDocumentVersion`, `activateDocumentVersion`, `updateDocumentAcl`, `suspendDocument`, `retryIngestionJob`, `startEvaluationRun`, `issueArtifactAccessCookie` の 10 件で、`getUserImport` は消えている。
- `npm run test:integration:local`: pass
- `npm run web:flow:check`: pass
- `npm run typecheck:source`: pass
- `npm run check:static`: pass
- `git diff --check`: pass

## PR レビュー観点

- admin role と active user 条件が SQL 上で維持されていること。
- tenant 境界を跨いだ import job / row 読み取りになっていないこと。
- 既存 OpenAPI response shape と local API response shape を壊していないこと。
- coverage manifest が実装実態より過大な完了扱いになっていないこと。

## リスク

- user import の作成・row event append は別 slice の対象であり、この slice では読み取り mapping だけを扱う。
