# API OpenAPI runtime mirror CI import fix 作業レポート

## 受けた指示

- `.workspace/plam-20260530-01.txt` 対応の継続作業として、PR #6 の CI 失敗を修正する。
- リポジトリルールに従い、task md、検証、PR コメント、作業レポートを残す。

## 要件整理

- GitHub Actions の no-install job でも生成済み API OpenAPI runtime mirror JS が import 解決できること。
- generator の再実行で同じ import 方針が再現されること。
- 未実施の検証を実施済みとして扱わないこと。

## 検討・判断

- CI log では `apps/api/src/openapi-document.js` が `@saphnexa/api-contract` を解決できず `ERR_MODULE_NOT_FOUND` になっていた。
- ローカルでは `node_modules` の workspace symlink により bare import が解決できるため、no-install CI job 固有の差として見落とされていた。
- TS source 側では workspace package import を維持し、generator が runtime JS mirror のみ相対 source path へ変換する方針にした。

## 実施作業

- `tools/generate-api-openapi-runtime-mirror.js` に path-aware な internal workspace package import rewrite を追加した。
- generator と generated surface check に `@saphnexa/domain` / `@saphnexa/api-contract` の残存 assert を追加した。
- `npm run api:openapi:generate` で generated JS を再生成した。

## 成果物

- `tools/generate-api-openapi-runtime-mirror.js`
- `apps/api/src/hono-openapi-app.js`
- `apps/api/src/openapi-document.js`
- `apps/api/src/middleware/csrf.js`
- `apps/api/src/middleware/error.js`
- `apps/api/src/middleware/origin.js`
- `tasks/do/20260530-1541-api-openapi-ci-import-fix.md`

## 検証

- `npm run api:openapi:generate`: 成功
- `rg -n "@saphnexa/(api-contract|domain)" apps/api/src/*.js apps/api/src/middleware/*.js`: 一致なし
- `npm run api:openapi:check`: 成功
- `npm run test:contract`: 成功
- `npm run typecheck:source`: 成功
- `npm run check:no-src-js`: 成功
- `npm run check:static`: 成功
- `npm run ci:check`: 成功
- `git diff --check`: 成功

## fit 評価

- CI 失敗の直接原因だった generated JS の bare workspace import を相対 import に置き換え、再生成時にも残存検査される状態にした。
- 変更は API OpenAPI runtime mirror generator とその生成物に限定した。

## 未対応・制約・リスク

- GitHub Actions の再実行結果は push 後に確認する。
- この修正は API OpenAPI runtime mirror の CI import 問題への対応であり、`.workspace/plam-20260530-01.txt` 全体の未完了項目は別途継続する。
