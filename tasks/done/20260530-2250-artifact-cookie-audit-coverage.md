# Artifact cookie audit coverage slice

- 状態: done
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 22:50 JST
- 完了: 2026-05-30 22:55 JST
- タスク種別: 機能追加

## 背景

`issueArtifactAccessCookie` は coverage manifest 上で production と audit が `planned` のまま残っている。
local store は admin actor のみ artifact access cookie 発行結果を返し、`admin.artifact.cookie_issued` audit event を記録している。

## 目的

`issueArtifactAccessCookie` の DSQL query plan に admin 境界と audit append を追加し、API production planned marker を 10 件から 9 件へ減らす。

## 対象 API

- `issueArtifactAccessCookie`

## 実施計画

1. local store の artifact cookie response と audit behavior を確認する。
2. `apps/api/src/repositories/dsql/apiRepository.ts` に `issueArtifactAccessCookie` mapping を追加する。
3. `packages/api-contract/src/implementation-coverage.ts` の対象 API から planned marker を外す。
4. generated coverage mirror を再生成し、検証を実行する。
5. 作業レポート、commit / push、PR コメント、CI 確認、task done 移動まで実施する。

## ドキュメントメンテナンス計画

- API shape、route、permission、OpenAPI schema は変更しないため durable docs の更新は不要と判断する。
- 実 CloudFront signed cookie 発行ではなく、既存 local API と同じ response shape の DSQL audit coverage を追加する。
- 一時的な作業記録は task md と `reports/working/` に残す。

## 受け入れ条件

- [x] `issueArtifactAccessCookie` の DSQL query plan が追加される。
- [x] query plan が active admin actor に限定される。
- [x] `audit_events` に `admin.artifact.cookie_issued` を append する。
- [x] response shape が `{ cookie_issued: true, expires_in_seconds: 300 }` を維持する。
- [x] `packages/api-contract/src/implementation-coverage.ts` 上で `issueArtifactAccessCookie` に planned marker が残らない。
- [x] generated coverage mirror が更新される。
- [x] `npm run implementation-coverage:generate` が成功する。
- [x] `npm run implementation-coverage:check` が成功する。
- [x] `npm run api:implementation:check` が成功し、planned marker 数が 9 件になる。
- [x] `npm run api:implementation:check:production` の失敗リストから `issueArtifactAccessCookie` が消える。
- [x] `npm run test:integration:local` が成功する。
- [x] `npm run web:flow:check` が成功する。
- [x] `npm run typecheck:source` が成功する。
- [x] `npm run check:static` が成功する。
- [x] `git diff --check` が成功する。
- [x] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- [x] GitHub Actions の PR check が成功する。

## 実施結果

- 実装 commit: `3aacff7`
- 作業レポート: `reports/working/20260530-2250-artifact-cookie-audit-coverage.md`
- PR 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4583033469
- PR セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4583073544
- GitHub Actions: `gh pr checks 6 --watch --interval 10` で pass を確認。

## 検証結果

- `npm run implementation-coverage:generate`: pass
- `npm run implementation-coverage:check`: pass
- `npm run api:implementation:check`: pass（40 operations, 9 planned markers）
- `npm run api:implementation:check:production`: expected fail。失敗リストは `submitQuestion`, `startUserImport`, `createDocument`, `createDocumentVersion`, `activateDocumentVersion`, `updateDocumentAcl`, `suspendDocument`, `retryIngestionJob`, `startEvaluationRun` の 9 件で、`issueArtifactAccessCookie` は消えている。
- `npm run test:integration:local`: pass
- `npm run web:flow:check`: pass
- `npm run typecheck:source`: pass
- `npm run check:static`: pass
- `git diff --check`: pass

## PR レビュー観点

- admin role と active user 条件が SQL 上で維持されていること。
- audit event の category / resource_id / payload が local store と整合すること。
- CloudFront signed cookie の実発行を実装済みと誤認させないこと。
- coverage manifest が実装実態より過大な完了扱いになっていないこと。

## リスク

- 実 CloudFront signed cookie 生成・署名・Set-Cookie header 発行はこの slice の対象外。
