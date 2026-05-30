# Auth API coverage slice 作業レポート

## 受けた指示

- `.workspace/plam-20260530-01.txt` 対応を継続し、production coverage planned marker を減らす。
- リポジトリルールに従い、task md、検証、PR コメント、作業レポートを残す。

## 要件整理

- plan が最優先として挙げる auth API 3件を planned から外す。
- local fixture handler、DSQL repository mapping、coverage manifest、検証を同期する。
- production-ready 全体はまだ残件があるため、未達を完了扱いにしない。

## 検討・判断

- `loginStart` は Cognito redirect 境界なので production は external として扱い、local fixture では 302 相当の redirect payload を返す。
- `authCallback` は Cognito code exchange 自体は外部境界だが、DSQL 側は session event append と projection creation の query plan を持たせた。
- `logout` は DSQL 側で session revoke event append と projection update の query plan を持たせた。
- coverage の aggregate route/schema/usecase は個別分割前の状態を正直に残し、aggregate test coverage として planned marker なしを許可した。

## 実施作業

- `apps/api/src/local-api.ts` に `loginStart` / `authCallback` / `logout` handler を追加した。
- `npm run api:local:generate` で `apps/api/src/local-api.js` を再生成した。
- `apps/api/src/repositories/dsql/apiRepository.ts` に `authCallback` / `logout` mapping を追加した。
- `packages/api-contract/src/implementation-coverage.ts` と generated JS mirror を更新した。
- `tests/integration-local.test.js` に auth local session event / logout revoke test を追加した。
- `tools/check-atomicity.js` の aggregate coverage 判定を aggregate test coverage に対応させた。

## 成果物

- `apps/api/src/local-api.ts`
- `apps/api/src/local-api.js`
- `apps/api/src/repositories/dsql/apiRepository.ts`
- `packages/api-contract/src/implementation-coverage.ts`
- `packages/api-contract/src/implementation-coverage.js`
- `tests/integration-local.test.js`
- `tools/check-atomicity.js`
- `tasks/done/20260530-1706-auth-api-coverage-slice.md`

## 検証

- `npm run implementation-coverage:generate`: 成功
- `npm run implementation-coverage:check`: 成功
- `npm run api:local:generate`: 成功
- `npm run api:local:check`: 成功
- `npm run api:implementation:check`: 成功、`37 planned markers`
- `npm run api:implementation:check:production`: 失敗。ただし失敗リストから `loginStart` / `authCallback` / `logout` が消えた。
- `npm run test:integration:local`: 成功
- `npm run typecheck:source`: 成功
- `npm run check:static`: 成功
- `git diff --check`: 成功
- GitHub Actions PR checks: 成功

## fit 評価

- API production coverage planned marker を 40 件から 37 件に減らし、auth API 3件の local / DSQL / coverage 境界を前進させた。
- Cognito 実 redirect / code exchange / cookie 発行の実 HTTP 結合は外部境界として残し、完了扱いにしていない。

## 未対応・制約・リスク

- `npm run api:implementation:check:production` は残り37件の planned marker で引き続き失敗する。
- Auth callback の実 Cognito token exchange、HttpOnly cookie 発行、実 DSQL executor smoke は後続タスクとして残る。
