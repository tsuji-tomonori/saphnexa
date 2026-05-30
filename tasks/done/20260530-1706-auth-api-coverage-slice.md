# Auth API coverage slice

- 状態: done
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 17:06 JST

## 背景

`.workspace/plam-20260530-01.txt` は auth API の `loginStart` / `authCallback` / `logout` を最優先課題としている。
現在 `npm run api:implementation:check:production` は API 40件の planned marker で失敗しており、この3件も planned に含まれる。

## 目的

Auth API 3件を local fixture / DSQL repository / implementation coverage 上で planned から外し、production coverage fail 件数を減らす。

## 受け入れ条件

- `loginStart` / `authCallback` / `logout` の local fixture handler が存在する。
- `authCallback` / `logout` の DSQL mapping key が存在し、web_session event/projection 境界を表す query plan を持つ。
- `loginStart` は external production implementation として理由を保持する。
- `packages/api-contract/src/implementation-coverage.ts` 上で auth API 3件に planned marker が残らない。
- `npm run implementation-coverage:generate` が成功する。
- `npm run api:local:generate` が成功する。
- `npm run api:implementation:check` が成功し、planned marker 数が減る。
- `npm run api:implementation:check:production` の失敗リストから auth API 3件が消える。
- `npm run test:integration:local` が成功する。
- `npm run typecheck:source` が成功する。
- `npm run check:static` が成功する。
- `git diff --check` が成功する。
- PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- GitHub Actions の PR check が成功する。

## 実施結果

- `apps/api/src/local-api.ts` / generated `local-api.js` に `loginStart`、`authCallback`、`logout` の local fixture handler を追加した。
- `apps/api/src/repositories/dsql/apiRepository.ts` に `authCallback` / `logout` mapping を追加し、`web_session_events` append と `web_sessions` projection 境界を query plan に含めた。
- DSQL mapping が 302 / 204 を返せるように mapping status を追加した。
- `packages/api-contract/src/implementation-coverage.ts` と generated mirror で auth API 3件の planned marker を外した。
- `tests/integration-local.test.js` に auth local session event / logout revoke の検証を追加した。
- `tools/check-atomicity.js` は aggregate coverage が planned marker なしでも aggregate test coverage を持つ場合を許可するようにした。

## 検証

- [x] `npm run implementation-coverage:generate`
- [x] `npm run implementation-coverage:check`
- [x] `npm run api:local:generate`
- [x] `npm run api:local:check`
- [x] `npm run api:implementation:check` (`37 planned markers`)
- [x] `npm run api:implementation:check:production` は失敗するが、失敗リストから `loginStart` / `authCallback` / `logout` が消えた
- [x] `npm run test:integration:local`
- [x] `npm run typecheck:source`
- [x] `npm run check:static`
- [x] `git diff --check`
- [x] PR 受け入れ条件確認コメント
- [x] PR セルフレビューコメント
- [x] GitHub Actions の PR check 成功

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582266871
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582273494

## CI

- PR checks: 2026-05-30 17:14 JST 時点で全 job pass
