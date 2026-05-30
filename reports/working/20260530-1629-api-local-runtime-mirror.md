# API local runtime mirror generation 作業レポート

## 受けた指示

- `.workspace/plam-20260530-01.txt` 対応を継続し、API local dispatcher の残存 JS source-of-truth 問題を前進させる。
- リポジトリルールに従い、task md、検証、PR コメント、作業レポートを残す。

## 要件整理

- `apps/api/src/local-api.js` を手書き互換 JS ではなく TypeScript source 由来の generated mirror にする。
- 生成 drift を source gate で検出できるようにする。
- 既存 local Node tests の import path は維持する。

## 検討・判断

- local dispatcher は現在の local fixture / integration tests の互換境界なので、JS path は維持した。
- TS 正本では Error 拡張を `localApiError` helper に寄せ、catch では `LocalApiError` として扱うことで既存挙動を維持した。
- `consumeWsTicket` は public route contract 外の local internal operation として使われるため、dispatcher の operation id は `string` のまま受ける方針にした。

## 実施作業

- `apps/api/src/local-api.ts` を追加した。
- `tools/generate-api-local-runtime-mirror.js` を追加した。
- root `package.json` に `api:local:generate` / `api:local:check` を追加した。
- `tools/check-type-surface.js` に API local mirror check を統合した。
- `apps/api/src/local-api.js` を生成物に更新した。
- `tools/source-js-allowlist.json` と `docs/ops/local-verification.md` を同期した。

## 成果物

- `apps/api/src/local-api.ts`
- `apps/api/src/local-api.js`
- `tools/generate-api-local-runtime-mirror.js`
- `tools/check-type-surface.js`
- `tools/source-js-allowlist.json`
- `docs/ops/local-verification.md`
- `tasks/done/20260530-1629-api-local-runtime-mirror.md`

## 検証

- `npm run api:local:generate`: 成功
- `npm run api:local:check`: 成功
- `npm run typecheck:source`: 成功
- `npm run check:no-src-js`: 成功
- `npm run check:static`: 成功
- `git diff --check`: 成功
- GitHub Actions PR checks: 成功

## fit 評価

- `apps/api/src/local-api.js` を TS 正本から再生成可能にし、plan の JS source-of-truth 廃止方針に沿って前進した。
- local fixture dispatcher の既存 operation 分岐と CSRF guard / RAG adapter 境界は維持した。

## 未対応・制約・リスク

- API 40 operation の route/schema/usecase 個別分割、production DSQL mapping の planned marker 削減、event append/projector 実装は後続タスクとして残る。
