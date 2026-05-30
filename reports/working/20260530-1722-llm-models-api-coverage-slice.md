# LLM models API coverage slice 作業レポート

## 受けた指示

- `.workspace/plam-20260530-01.txt` 対応を継続し、API production coverage planned marker を減らす。
- リポジトリルールに従い、task md、検証、PR コメント、作業レポートを残す。

## 要件整理

- Auth API slice 後に残った planned marker 37 件から、既に実装・検証根拠が揃う `listLlmModels` を planned から外す。
- model visibility は role/actor 境界を弱めず、既存 admin/web flow 検証で確認する。
- production-ready 全体はまだ残件があるため、未達を完了扱いにしない。

## 検討・判断

- `listLlmModels` は local fixture handler と DSQL query plan が既に存在し、`llm_models` を active user と role 条件で絞り込んでいる。
- 状態変更 API ではないため domain event / audit は `not_required` のままとした。
- 個別 unit/dsql smoke 分割は未実施だが、既存の aggregate workflow/static 検証が model visibility と DSQL mapping surface を確認しているため、coverage 上は aggregate として明示した。

## 実施作業

- `packages/api-contract/src/implementation-coverage.ts` の `listLlmModels` を production implemented に更新した。
- `npm run implementation-coverage:generate` で generated mirror を更新した。
- `apps/api/src/local-api.ts` の local handler、`apps/api/src/repositories/dsql/apiRepository.ts` の DSQL mapping、既存検証の根拠を確認した。

## 成果物

- `packages/api-contract/src/implementation-coverage.ts`
- `packages/api-contract/src/implementation-coverage.js`
- `tasks/done/20260530-1722-llm-models-api-coverage-slice.md`

## 検証

- `npm run implementation-coverage:generate`: 成功
- `npm run implementation-coverage:check`: 成功
- `npm run api:implementation:check`: 成功、`36 planned markers`
- `npm run api:implementation:check:production`: 失敗。ただし失敗リストから `listLlmModels` が消えた。
- `npm run admin:workflow:check`: 成功
- `npm run web:flow:check`: 成功
- `npm run typecheck:source`: 成功
- `npm run check:static`: 成功
- `git diff --check`: 成功
- GitHub Actions PR checks: 成功

## fit 評価

- API production coverage planned marker を 37 件から 36 件に減らし、既存の LLM model catalog 実装・検証実態と coverage manifest を同期した。
- model visibility の認可境界は既存検証で、管理者向け judge model と一般ユーザー向け非公開 model の非表示を確認した。

## 未対応・制約・リスク

- `npm run api:implementation:check:production` は残り36件の planned marker で引き続き失敗する。
- `listLlmModels` の専用 unit test / 実 DSQL executor smoke は未分割で、現時点では aggregate 検証として扱っている。
