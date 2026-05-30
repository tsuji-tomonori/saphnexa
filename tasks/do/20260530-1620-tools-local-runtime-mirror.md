# Tools API local runtime mirror generation

- 状態: doing
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 16:20 JST

## 背景

`.workspace/plam-20260530-01.txt` は `apps/tools-api/src/local-tools-api.js` を残存 JS source の廃止対象に含めている。
現状の `local-tools-api.js` は手書き JS の local fixture wrapper で、Tools API の TS source-of-truth 化から外れている。

## 目的

Tools API local fixture wrapper を TypeScript source-of-truth から生成される runtime mirror に変更し、手書き JS を減らす。

## 受け入れ条件

- `apps/tools-api/src/local-tools-api.ts` が local fixture wrapper の正本になる。
- `apps/tools-api/src/local-tools-api.js` が `.ts` から生成される。
- generator check が `npm run typecheck:source` または同等の source surface gate に含まれる。
- `tools/source-js-allowlist.json` の `apps/tools-api/src/local-tools-api.js` 理由が generated mirror として更新される。
- `npm run tools-api:local:generate` が成功する。
- `npm run tools-api:local:check` が成功する。
- `npm run typecheck:source` が成功する。
- `npm run check:no-src-js` が成功する。
- `npm run check:static` が成功する。
- `git diff --check` が成功する。
- PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- GitHub Actions の PR check が成功する。

## docs 影響

- 外部仕様は変えない。
- 生成コマンドと gate の追加に合わせて `docs/ops/local-verification.md` に `tools-api:local:check` を追記する。

## 実施結果

- `apps/tools-api/src/local-tools-api.ts` を追加し、local fixture wrapper の TS 正本にした。
- `tools/generate-tools-local-runtime-mirror.js` を追加し、`apps/tools-api/src/local-tools-api.js` を生成物にした。
- root script に `tools-api:local:generate` / `tools-api:local:check` を追加した。
- `tools/check-type-surface.js` から generator check と tool contract path handler 同期を検査するようにした。
- `tools/source-js-allowlist.json` の `apps/tools-api/src/local-tools-api.js` 理由を generated mirror に更新した。
- `docs/ops/local-verification.md` に Tools API local runtime mirror check を追記した。

## 検証

- [x] `npm run tools-api:local:generate`
- [x] `npm run tools-api:local:check`
- [x] `npm run typecheck:source`
- [x] `npm run check:no-src-js`
- [x] `npm run check:static`
- [x] `git diff --check`
- [ ] PR 受け入れ条件確認コメント
- [ ] PR セルフレビューコメント
- [ ] GitHub Actions の PR check 成功
