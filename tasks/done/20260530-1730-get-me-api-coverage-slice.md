# getMe API coverage slice

- 状態: done
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 17:30 JST

## 背景

`.workspace/plam-20260530-01.txt` は API operation coverage の planned marker を production-ready gate で 0 にする方針を示している。
`getMe` は local handler、OpenAPI schema、DSQL mapping、CSRF token issuer 境界、既存 local integration checks が揃っているが、coverage manifest 上は planned marker を持つ。

## 目的

`getMe` の coverage manifest を既存実装・検証実態に合わせ、API production coverage の planned marker を 36 件から 35 件へ減らす。

## 受け入れ条件

- [x] `getMe` の local fixture handler が存在し、未認証時は 401 を返す。
- [x] `getMe` の DSQL mapping key が存在し、active `web_sessions` と active `users` を actor で結合する query plan を持つ。
- [x] DSQL repository が `getMe` で `csrfTokenIssuer` 未設定を明示的に拒否する。
- [x] `packages/api-contract/src/implementation-coverage.ts` 上で `getMe` に planned marker が残らない。
- [x] generated coverage mirror が更新される。
- [x] `npm run implementation-coverage:generate` が成功する。
- [x] `npm run implementation-coverage:check` が成功する。
- [x] `npm run api:implementation:check` が成功し、planned marker 数が 35 件になる。
- [x] `npm run api:implementation:check:production` の失敗リストから `getMe` が消える。
- [x] `npm run test:integration:local` が成功する。
- [x] `npm run web:flow:check` が成功する。
- [x] `npm run typecheck:source` が成功する。
- [x] `npm run check:static` が成功する。
- [x] `git diff --check` が成功する。
- [x] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- [x] GitHub Actions の PR check が成功する。

## 実施結果

- `packages/api-contract/src/implementation-coverage.ts` の `getMe` を production implemented のまま、aggregate unit/dsql smoke 検証を明示して planned marker を外した。
- `packages/api-contract/src/implementation-coverage.js` を再生成した。
- `apps/api/src/local-api.ts` の local handler と未認証 401、`apps/api/src/repositories/dsql/apiRepository.ts` の DSQL mapping と `csrfTokenIssuer` 境界を確認した。

## 検証

- [x] `npm run implementation-coverage:generate`
- [x] `npm run implementation-coverage:check`
- [x] `npm run api:implementation:check` (`35 planned markers`)
- [x] `npm run api:implementation:check:production` は失敗するが、失敗リストから `getMe` が消えた
- [x] `npm run test:integration:local`
- [x] `npm run web:flow:check`
- [x] `npm run typecheck:source`
- [x] `npm run check:static`
- [x] `git diff --check`
- [x] PR 受け入れ条件確認コメント
- [x] PR セルフレビューコメント
- [x] GitHub Actions の PR check 成功

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582305632
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582306052

## CI

- PR checks: 2026-05-30 17:35 JST 時点で全 job pass
