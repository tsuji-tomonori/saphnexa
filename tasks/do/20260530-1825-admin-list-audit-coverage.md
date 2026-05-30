# Admin list audit coverage slice

- 状態: doing
- 作業ブランチ: `codex/ts-atomic-coverage`
- 対象PR: #6
- 開始: 2026-05-30 18:25 JST
- タスク種別: 機能追加

## 背景

Favorites coverage alignment slice 後も `adminListUsers`、`adminListDocuments` は coverage manifest 上で production / audit planned marker を持つ。
対象 API は local handler、DSQL mapping、admin boundary、integration / web flow coverage が存在するが、管理系 read として `audit_events` append が DSQL plan 内に存在しない。

## 目的

対象 API 2件の DSQL query plan に `audit_events` append を追加し、admin actor 境界を維持したまま coverage planned marker を 16 件から 14 件へ減らす。

## 対象 API

- `adminListUsers`
- `adminListDocuments`

## 実施計画

1. 対象 DSQL mapping と admin boundary、既存 local / web flow coverage を確認する。
2. 対象 DSQL query plan に `audit_events` append CTE を追加する。
3. `packages/api-contract/src/implementation-coverage.ts` の対象 API 2件から planned marker を外す。
4. generated coverage mirror を再生成する。
5. coverage / local integration / static checks を実行する。
6. 作業レポート、commit / push、PR コメント、CI 確認、task done 移動まで実施する。

## ドキュメントメンテナンス計画

- API shape、route、permission、OpenAPI schema は変更しないため durable docs の更新は不要と判断する。
- 一時的な作業記録は task md と `reports/working/` に残す。

## 受け入れ条件

- [ ] 対象 API 2件の DSQL query plan が `audit_events` に audit event を append する。
- [ ] 対象 API 2件の admin actor 境界を弱めない。
- [ ] 対象 API 2件の local / web flow 検証が存在する。
- [ ] `packages/api-contract/src/implementation-coverage.ts` 上で対象 API 2件に planned marker が残らない。
- [ ] generated coverage mirror が更新される。
- [ ] `npm run implementation-coverage:generate` が成功する。
- [ ] `npm run implementation-coverage:check` が成功する。
- [ ] `npm run api:implementation:check` が成功し、planned marker 数が 14 件になる。
- [ ] `npm run api:implementation:check:production` の失敗リストから対象 API 2件が消える。
- [ ] `npm run test:integration:local` が成功する。
- [ ] `npm run web:flow:check` が成功する。
- [ ] `npm run typecheck:source` が成功する。
- [ ] `npm run check:static` が成功する。
- [ ] `git diff --check` が成功する。
- [ ] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で追加する。
- [ ] GitHub Actions の PR check が成功する。

## PR レビュー観点

- 管理系 read の audit append が result set を変えていないこと。
- admin actor 境界が SQL 上で維持されていること。
- coverage manifest が実装実態より過大な完了扱いになっていないこと。

## リスク

- read operation に audit append を追加するため、実 DSQL では read のたびに audit record が増える。管理系 read の監査性を優先した判断として扱う。
- write 系 planned marker は別 slice で対応する。
