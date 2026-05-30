# Favorites coverage alignment slice

- 状態: done
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 18:19 JST
- タスク種別: ドキュメント更新

## 背景

Participant domain event slice 後も `addFavorite`、`deleteFavorite` は coverage manifest 上で `domainEvent: planned` を持つ。
一方で `docs/generated/db/lifecycle.md` は `favorites` を event-source projection ではなく「APIまたは管理操作で作成し、業務ルールに従って更新する」table として扱っている。
対象 API は local handler、DSQL mapping、local integration / web flow coverage が存在するため、domain event planned marker は実装方針と不整合になっている。

## 目的

`addFavorite`、`deleteFavorite` の coverage manifest を lifecycle doc と既存実装に合わせ、domain event を不要扱いに戻し、API production coverage の planned marker を 18 件から 16 件へ減らす。

## 対象 API

- `addFavorite`
- `deleteFavorite`

## 実施計画

1. `favorites` の lifecycle と DSQL mapping、local / web flow coverage を確認する。
2. `packages/api-contract/src/implementation-coverage.ts` の対象 API 2件から誤った `domainEvent: planned` を外し、aggregate 検証状態を明示する。
3. generated coverage mirror を再生成する。
4. coverage / local integration / static checks を実行する。
5. 作業レポート、commit / push、PR コメント、CI 確認、task done 移動まで実施する。

## ドキュメントメンテナンス計画

- durable docs は既に `favorites` の lifecycle を event-source projection ではない table として記載しているため更新不要。
- 一時的な作業記録は task md と `reports/working/` に残す。

## 受け入れ条件

- [x] `docs/generated/db/lifecycle.md` で `favorites` が domain event append 前提ではないことを確認する。
- [x] 対象 API 2件の DSQL mapping key が存在する。
- [x] 対象 API 2件の local / web flow 検証が存在する。
- [x] `packages/api-contract/src/implementation-coverage.ts` 上で対象 API 2件に planned marker が残らない。
- [x] generated coverage mirror が更新される。
- [x] `npm run implementation-coverage:generate` が成功する。
- [x] `npm run implementation-coverage:check` が成功する。
- [x] `npm run api:implementation:check` が成功し、planned marker 数が 16 件になる。
- [x] `npm run api:implementation:check:production` の失敗リストから対象 API 2件が消える。
- [x] `npm run test:integration:local` が成功する。
- [x] `npm run web:flow:check` が成功する。
- [x] `npm run typecheck:source` が成功する。
- [x] `npm run check:static` が成功する。
- [x] `git diff --check` が成功する。
- [x] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- [x] GitHub Actions の PR check が成功する。

## PR レビュー観点

- lifecycle doc と coverage manifest の整合が取れていること。
- `favorites` の owner scope / readable chat / assistant message 制約を過大評価していないこと。
- coverage manifest が実装実態より過大な完了扱いになっていないこと。

## リスク

- event-source projection ではない table として扱う判断に依存する。将来 `favorites` を event-source 化する場合は別途 lifecycle doc と schema から見直す。
- message / run / feedback / admin write 系の planned marker は別 slice で対応する。

## 実施結果

- `docs/generated/db/lifecycle.md` 上で `favorites` が event-source projection 前提ではないことを確認した。
- `apps/api/src/repositories/dsql/apiRepository.ts` に `addFavorite`、`deleteFavorite` の DSQL mapping が存在することを確認した。
- `tests/integration-local.test.js` と `tools/check-web-flows.js` に favorite add/delete flow 検証があることを確認した。
- `packages/api-contract/src/implementation-coverage.ts` と generated mirror から対象 API 2件の planned marker を外した。
- API implementation coverage は 18 planned markers から 16 planned markers へ減少した。

## 検証

- [x] `npm run implementation-coverage:generate`
- [x] `npm run implementation-coverage:check`
- [x] `npm run api:implementation:check` (`40 operations, 16 planned markers`)
- [x] `npm run api:implementation:check:production` は失敗するが、失敗リストから対象 API 2件が消えた
- [x] `npm run test:integration:local`
- [x] `npm run web:flow:check`
- [x] `npm run typecheck:source`
- [x] `npm run check:static`
- [x] `git diff --check`
- [x] PR 受け入れ条件確認コメント
- [x] PR セルフレビューコメント
- [x] GitHub Actions の PR check 成功

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582404368
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4582404957

## CI

- PR checks: 2026-05-30 18:23 JST 時点で全 job pass
