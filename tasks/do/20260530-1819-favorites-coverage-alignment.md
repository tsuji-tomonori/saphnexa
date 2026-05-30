# Favorites coverage alignment slice

- 状態: doing
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

- [ ] `docs/generated/db/lifecycle.md` で `favorites` が domain event append 前提ではないことを確認する。
- [ ] 対象 API 2件の DSQL mapping key が存在する。
- [ ] 対象 API 2件の local / web flow 検証が存在する。
- [ ] `packages/api-contract/src/implementation-coverage.ts` 上で対象 API 2件に planned marker が残らない。
- [ ] generated coverage mirror が更新される。
- [ ] `npm run implementation-coverage:generate` が成功する。
- [ ] `npm run implementation-coverage:check` が成功する。
- [ ] `npm run api:implementation:check` が成功し、planned marker 数が 16 件になる。
- [ ] `npm run api:implementation:check:production` の失敗リストから対象 API 2件が消える。
- [ ] `npm run test:integration:local` が成功する。
- [ ] `npm run web:flow:check` が成功する。
- [ ] `npm run typecheck:source` が成功する。
- [ ] `npm run check:static` が成功する。
- [ ] `git diff --check` が成功する。
- [ ] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- [ ] GitHub Actions の PR check が成功する。

## PR レビュー観点

- lifecycle doc と coverage manifest の整合が取れていること。
- `favorites` の owner scope / readable chat / assistant message 制約を過大評価していないこと。
- coverage manifest が実装実態より過大な完了扱いになっていないこと。

## リスク

- event-source projection ではない table として扱う判断に依存する。将来 `favorites` を event-source 化する場合は別途 lifecycle doc と schema から見直す。
- message / run / feedback / admin write 系の planned marker は別 slice で対応する。
