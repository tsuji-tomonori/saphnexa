# getMe API coverage slice 作業レポート

## 受けた指示

- `.workspace/plam-20260530-01.txt` 対応を継続し、API production coverage planned marker を減らす。
- リポジトリルールに従い、task md、検証、PR コメント、作業レポートを残す。

## 要件整理

- Auth / LLM models slice 後に残った planned marker 36 件から、既に実装・検証根拠が揃う `getMe` を planned から外す。
- CSRF token issuer と active session/user の認証境界は弱めない。
- production-ready 全体はまだ残件があるため、未達を完了扱いにしない。

## 検討・判断

- `getMe` は local fixture handler、OpenAPI schema、DSQL query plan が存在し、local integration / web flow checks の基礎 CSRF 取得経路として継続検証されている。
- DSQL 実行時は `csrfTokenIssuer` 未設定を `DSQL_CSRF_ISSUER_NOT_BOUND` として拒否する境界がある。
- 個別 unit/dsql smoke 分割は未実施だが、既存の aggregate integration/static 検証が getMe と CSRF 境界を確認しているため、coverage 上は aggregate として明示した。

## 実施作業

- `packages/api-contract/src/implementation-coverage.ts` の `getMe` から planned marker を外した。
- `npm run implementation-coverage:generate` で generated mirror を更新した。
- `apps/api/src/local-api.ts` の local handler、`apps/api/src/repositories/dsql/apiRepository.ts` の DSQL mapping と CSRF issuer 境界を確認した。

## 成果物

- `packages/api-contract/src/implementation-coverage.ts`
- `packages/api-contract/src/implementation-coverage.js`
- `tasks/done/20260530-1730-get-me-api-coverage-slice.md`

## 検証

- `npm run implementation-coverage:generate`: 成功
- `npm run implementation-coverage:check`: 成功
- `npm run api:implementation:check`: 成功、`35 planned markers`
- `npm run api:implementation:check:production`: 失敗。ただし失敗リストから `getMe` が消えた。
- `npm run test:integration:local`: 成功
- `npm run web:flow:check`: 成功
- `npm run typecheck:source`: 成功
- `npm run check:static`: 成功
- `git diff --check`: 成功
- GitHub Actions PR checks: 成功

## fit 評価

- API production coverage planned marker を 36 件から 35 件に減らし、既存の getMe 実装・検証実態と coverage manifest を同期した。
- CSRF token issuer / active session / active user の境界は維持し、固定 user fallback は追加していない。

## 未対応・制約・リスク

- `npm run api:implementation:check:production` は残り35件の planned marker で引き続き失敗する。
- `getMe` の専用 unit test / 実 DSQL executor smoke は未分割で、現時点では aggregate 検証として扱っている。
