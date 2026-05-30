# Contract package coverage manifest 正本化

## 背景

`.workspace/plam-20260530-01.txt` は、`packages/api-contract` を route 定義だけでなく operation coverage manifest の正本にし、`packages/tool-contract` を tool 定義だけでなく tool implementation coverage manifest の正本にすることを求めている。

PR #6 では coverage gate を追加したが、coverage manifest 本体は `tools/implementation-coverage-manifest.js` に置かれており、contract package 側の正本化にはまだ不足がある。

## 目的

API / Tools implementation coverage manifest を contract package 配下へ移し、検査スクリプトが contract package の manifest を読んでいる状態にする。

## タスク種別

機能追加

## スコープ

- `packages/api-contract` 配下に API implementation coverage manifest を置く。
- `packages/tool-contract` 配下に Tools implementation coverage manifest を置く。
- 既存 check scripts が contract package の manifest を参照するよう更新する。
- stale な `tools/implementation-coverage-manifest.js` を廃止する。
- docs / report / PR コメントを更新する。

## スコープ外

- API 40件の file-per-operation 実分割。
- Tools API 6件の tool-per-directory 実分割。
- production-ready strict gate を pass させること。

## 実施計画

1. 既存 manifest と check scripts の依存関係を確認する。
2. API / Tools manifest を contract package 配下へ分離する。
3. check scripts と docs を新しい配置に合わせる。
4. targeted checks と必要な broader checks を実行する。
5. 作業レポート、commit、push、PR コメント、task done 更新を行う。

## ドキュメント保守方針

検証コマンドの意味は前回 docs に記載済み。今回は manifest の正本配置変更なので、`docs/ops/local-verification.md` の説明に contract package 配下の manifest 参照を追記する。

## 受け入れ条件

- [x] AC1: API implementation coverage manifest が `packages/api-contract` 配下に存在する。
- [x] AC2: Tools implementation coverage manifest が `packages/tool-contract` 配下に存在する。
- [x] AC3: `tools/check-api-implementation-coverage.js` が `packages/api-contract` 側の manifest を参照する。
- [x] AC4: `tools/check-tools-implementation-coverage.js` が `packages/tool-contract` 側の manifest を参照する。
- [x] AC5: `tools/implementation-coverage-manifest.js` が残っていない。
- [x] AC6: `npm run api:implementation:check`、`npm run tools:implementation:check`、`npm run check:static`、`git diff --check` が pass する。
- [ ] AC7: PR に受け入れ条件確認とセルフレビュー更新を日本語で投稿する。

## 検証計画

- `npm run api:implementation:check`
- `npm run tools:implementation:check`
- `npm run check:static`
- `git diff --check`

## PR レビュー観点

- contract package 側が manifest 正本として読まれていること。
- planned marker を削って未実装を実装済みに見せていないこと。
- RAG / authorization / benchmark 実装に無関係な挙動変更がないこと。

## リスク

- 現在は runtime Node tools が `.js` を読むため、manifest も `.js` runtime surface として追加する。TypeScript source-of-truth 完全化時には `.ts` source 生成または package build 後の runtime artifact へ移す必要がある。

## 状態

in_progress
