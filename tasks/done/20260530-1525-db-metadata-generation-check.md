# DB metadata generation drift check

状態: done
タスク種別: 機能追加

## 背景

`.workspace/plam-20260530-01.txt` は `packages/*/src/*.js` のうち TS source と重複するものを廃止または generated 扱いにすることを求めている。`packages/db-schema/src/table-metadata.js` と `table-metadata.ts` は `tools/build-db-metadata-source.js` で生成されているが、生成 drift を直接検出する `--check` 導線がなく、source JS allowlist の説明も generated 扱いになっていない。

## 目的

DB metadata を migration source 由来の生成物として明示し、`table-metadata.js` / `.ts` の生成 drift を `db:metadata:check` と `typecheck:source` で検出できるようにする。

## Scope

- `tools/build-db-metadata-source.js` に `--check` を追加する。
- `db:metadata:check` と `typecheck:source` に DB metadata source drift check を組み込む。
- source JS allowlist と local verification docs を generated metadata surface として更新する。
- DB metadata / static checks を実行する。

## Non-scope

- DB metadata 内容そのものの再設計。
- Flyway 実 DB 適用、実 DSQL introspection。
- 残存 source JS 全体の削除。

## 実施計画

1. `build-db-metadata-source.js` の生成対象と既存 check の関係を確認する。
2. `--check` で `table-metadata.js` / `.ts` の committed 内容と生成内容を比較する。
3. `tools/check-db-metadata.js` と `tools/check-type-surface.js` へ drift check を統合する。
4. docs / allowlist を更新する。
5. DB metadata check、type surface、source JS、static、CI workflow、whitespace check を実行する。

## ドキュメント保守計画

`docs/ops/local-verification.md` に `npm run db:metadata:build` / `npm run db:metadata:check` が生成 drift も検査することを明記する。README や API docs は runtime API 変更ではないため更新不要とする。

## 受け入れ条件

- [x] `tools/build-db-metadata-source.js --check` が `packages/db-schema/src/table-metadata.js` と `.ts` の drift を検出できる。
- [x] `npm run db:metadata:check` が DB metadata source drift check を実行する。
- [x] `npm run typecheck:source` が DB metadata source drift check を実行する。
- [x] `tools/source-js-allowlist.json` が `table-metadata.js` を generated metadata surface として説明する。
- [x] `docs/ops/local-verification.md` が DB metadata 生成・検証導線を説明する。
- [x] `npm run db:metadata:build`、`npm run db:metadata:check`、`npm run typecheck:source` が pass する。
- [x] `npm run check:no-src-js`、`npm run check:static`、`npm run ci:check`、`git diff --check` が pass する。
- [x] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で投稿する。

PR コメント:

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4581958110
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4581958148

## 検証計画

- `npm run db:metadata:build`
- `npm run db:metadata:check`
- `npm run typecheck:source`
- `npm run check:no-src-js`
- `npm run check:static`
- `npm run ci:check`
- `git diff --check`

## PR レビュー観点

- 生成結果の内容が既存 metadata と drift していないこと。
- `--check` が `.js` だけでなく `.ts` も検査すること。
- DB metadata が generated source JS として明示されること。
- 実 DSQL introspection 済みと誤認させないこと。

## リスク

- `build-db-metadata-source.js` は生成時にファイルを書き換えるため、`--check` 実装では書き込みを避けて比較のみ行う必要がある。
