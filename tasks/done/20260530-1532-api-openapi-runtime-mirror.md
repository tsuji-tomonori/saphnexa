# API OpenAPI runtime mirror generation

状態: done
タスク種別: 機能追加

## 背景

`.workspace/plam-20260530-01.txt` は `apps/api/src/hono-openapi-app.ts` と `hono-openapi-app.js` の差分を課題として挙げている。TS 版には error / request-log / origin / session / csrf middleware があるが、JS mirror にはそれらがなく、dispatcher 未設定時の status もずれている。OpenAPI document と Zod schema catalog も TS source と JS runtime mirror の二重管理になっている。

## 目的

`apps/api/src/hono-openapi-app.ts`、`openapi-document.ts`、`zod-openapi-schemas.ts`、middleware TS を正本とし、Node checks が使う JS runtime mirror を生成物として扱えるようにする。Hono/OpenAPI/Zod の runtime behavior と middleware 境界を TS source と同期させる。

## Scope

- API OpenAPI runtime mirror generator を追加する。
- Hono/OpenAPI/Zod/middleware JS mirror を TS source から生成する。
- `api:openapi:check` と `typecheck:source` に drift check を組み込む。
- source JS allowlist と local verification docs を generated mirror として更新する。
- OpenAPI / contract / source / static checks を実行する。

## Non-scope

- `apps/api/src/local-api.js` の dispatcher 分割や auth local fixture 実装。
- DSQL repository の `Partial<Record<...>>` 解消。
- production mode で planned marker / unmapped operation を 0 にすること。

## 実施計画

1. TS/JS の API OpenAPI runtime surface と middleware import を確認する。
2. `tools/generate-api-openapi-runtime-mirror.js` を追加し、TS source を JS mirror へ変換する。
3. `package.json`、`Taskfile.yml`、`tools/check-api-openapi.js`、`tools/check-type-surface.js`、`tools/source-js-allowlist.json`、`docs/ops/local-verification.md` を更新する。
4. 生成 check、OpenAPI check、contract check、source/static check、CI workflow check、whitespace check を実行する。
5. 作業レポートを作成し、commit / push / PR コメント / task done 更新まで行う。

## ドキュメント保守計画

`docs/ops/local-verification.md` に API OpenAPI runtime mirror の生成・検証コマンドと、Hono middleware mirror が TS source から生成されることを追記する。README や API 契約 docs は契約そのものの変更ではないため更新不要とする。

## 受け入れ条件

- [x] `tools/generate-api-openapi-runtime-mirror.js` が追加され、API OpenAPI runtime JS mirror に生成 header が付く。
- [x] `npm run api:openapi:generate` と `npm run api:openapi:check` が利用でき、check が生成物 drift を検出できる。
- [x] `hono-openapi-app.js` が TS source と同じ middleware registration と dispatcher 未設定時 status を持つ。
- [x] `npm run typecheck:source` に API OpenAPI runtime mirror check が統合される。
- [x] `tools/source-js-allowlist.json` が API OpenAPI/middleware JS を generated mirror として説明する。
- [x] `docs/ops/local-verification.md` と `Taskfile.yml` が新しい検証導線を説明する。
- [x] `npm run api:openapi:generate`、`npm run api:openapi:check`、`npm run test:contract`、`npm run typecheck:source` が pass する。
- [x] `npm run check:no-src-js`、`npm run check:static`、`npm run ci:check`、`git diff --check` が pass する。
- [x] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で投稿する。

PR コメント:

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4581977307
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4581977352

## 検証計画

- `npm run api:openapi:generate`
- `npm run api:openapi:check`
- `npm run test:contract`
- `npm run typecheck:source`
- `npm run check:no-src-js`
- `npm run check:static`
- `npm run ci:check`
- `git diff --check`

## PR レビュー観点

- plan が指摘した Hono TS/JS の middleware 差分が解消されていること。
- OpenAPI document / Zod schema の operation count と response validation が維持されること。
- 生成 mirror が本番 API 実装済みと誤認されないこと。
- 未実施の DSQL / auth local fixture / production coverage を満たした扱いにしていないこと。

## リスク

- TS transpile による generated JS の import 解決を誤ると Node checks が壊れる。relative import は `.js` へ変換し、middleware JS mirror も同時生成する。
