# API OpenAPI runtime mirror CI import fix

- 状態: done
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 15:41 JST

## 背景

PR #6 の `contract generation diff` CI job で `npm run test:contract` が失敗した。

観測事実:

- GitHub Actions run `26677099478` / job `78630870061` で `Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@saphnexa/api-contract' imported from apps/api/src/openapi-document.js` が発生した。
- ローカル検証は `node_modules` の workspace symlink があるため同じ import でも通過していた。
- 生成済みの `apps/api/src/*.js` / `apps/api/src/middleware/*.js` に `@saphnexa/domain` と `@saphnexa/api-contract` の bare import が残っていた。

## 軽量なぜなぜ分析

問題文:

- 2026-05-30、PR #6 の no-install CI job で、生成済み API OpenAPI runtime mirror JS が workspace package import を解決できず、contract generation diff が失敗した。

因果:

1. なぜ CI で `ERR_MODULE_NOT_FOUND` が出たか。
   - 生成 JS が `@saphnexa/api-contract` / `@saphnexa/domain` を bare import していた。
2. なぜ bare import が CI で解決できなかったか。
   - 該当 CI job は dependency install 前提ではなく、workspace symlink がない状態で runtime JS を読む。
3. なぜ generator が bare import を残したか。
   - 既存 generator の rewrite は相対 import の `.js` 付与のみで、internal workspace package import を no-install 実行可能な相対 source path へ変換していなかった。
4. なぜローカル検証で検出できなかったか。
   - ローカル worktree は `node_modules` が存在し、bare import が解決できる環境だった。

再発防止:

- generator で internal workspace package import を生成元ファイル位置に応じた相対 JS import に変換する。
- generator/check に generated mirror 内の対象 bare import 残存検査を追加する。

## 受け入れ条件

- `tools/generate-api-openapi-runtime-mirror.js` が `@saphnexa/domain` と `@saphnexa/api-contract` を生成先からの相対 JS import に変換する。
- 生成済み API OpenAPI runtime mirror JS に `@saphnexa/domain` / `@saphnexa/api-contract` の bare import が残らない。
- `npm run api:openapi:generate` が成功する。
- `npm run api:openapi:check` が成功する。
- `npm run test:contract` が成功する。
- `npm run typecheck:source` が成功する。
- `npm run check:no-src-js` が成功する。
- `npm run check:static` が成功する。
- `npm run ci:check` が成功する。
- `git diff --check` が成功する。
- PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- GitHub Actions の PR check が成功する。

## 実施結果

- `tools/generate-api-openapi-runtime-mirror.js` で、生成元 `.ts` の位置から `packages/domain/src/index.js` / `packages/api-contract/src/routes.js` への相対 import を生成するようにした。
- generator と generated surface check に、対象 bare import が残らない assert を追加した。
- `apps/api/src/openapi-document.js`、`apps/api/src/hono-openapi-app.js`、middleware generated JS を再生成した。

## 検証

- [x] `npm run api:openapi:generate`
- [x] `rg -n "@saphnexa/(api-contract|domain)" apps/api/src/*.js apps/api/src/middleware/*.js` が一致なし
- [x] `npm run api:openapi:check`
- [x] `npm run test:contract`
- [x] `npm run typecheck:source`
- [x] `npm run check:no-src-js`
- [x] `npm run check:static`
- [x] `npm run ci:check`
- [x] `git diff --check`
- [x] PR 受け入れ条件確認コメント
- [x] PR セルフレビューコメント
- [x] GitHub Actions の PR check 成功

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582016901
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582018024

## CI

- PR checks: 2026-05-30 15:50 JST 時点で全 job pass
