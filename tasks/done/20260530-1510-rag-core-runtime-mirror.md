# RAG core runtime mirror generation

状態: done
タスク種別: 機能追加

## 背景

`.workspace/plam-20260530-01.txt` の TS 正本化方針に対し、`packages/rag-core/src/fixture-rag.js` は `fixture-rag.ts` と同じ runtime surface を手書き JavaScript として保持している。RAG core は品質・security・AWS binding check から参照されるため、TS 正本から JavaScript runtime mirror を生成・検証できる導線へ移す。

## 目的

`packages/rag-core/src/fixture-rag.ts` を正本とし、`packages/rag-core/src/fixture-rag.js` を生成物として扱えるようにする。既存の RAG 品質・security・AWS binding 検証は維持し、source JS allowlist では生成物であることを明示する。

## Scope

- `fixture-rag.ts` から `fixture-rag.js` を生成する script を追加する。
- npm script / Taskfile / type surface check に生成 drift check を組み込む。
- source JS allowlist と運用 docs を更新する。
- RAG 関連検証と repository static check を実行する。

## Non-scope

- RAG の本番実装化、Bedrock 連携の runtime 実装変更。
- RAG answer / tool invocation の意味的変更。
- 残存 source JS 全体の削除。

## 実施計画

1. 現行 `fixture-rag.ts` / `.js` の runtime 差分を確認する。
2. `tools/generate-rag-core-runtime-mirror.js` を追加し、生成 header 付き mirror を出力する。
3. `package.json`、`Taskfile.yml`、`tools/check-type-surface.js`、`tools/source-js-allowlist.json`、`docs/ops/local-verification.md` を更新する。
4. 生成 check、RAG 関連 check、静的 check、CI workflow check、whitespace check を実行する。
5. 作業レポートを作成し、commit / push / PR コメント / task done 更新まで行う。

## ドキュメント保守計画

`docs/ops/local-verification.md` に RAG core runtime mirror の生成・検証コマンドを追加する。README や API docs は runtime behavior 変更を伴わないため更新不要とする。

## 受け入れ条件

- [x] `tools/generate-rag-core-runtime-mirror.js` が追加され、`packages/rag-core/src/fixture-rag.js` に生成 header が付く。
- [x] `npm run rag-core:generate` と `npm run rag-core:check` が利用でき、check が生成物 drift を検出できる。
- [x] `npm run typecheck:source` に RAG core mirror check が統合される。
- [x] `tools/source-js-allowlist.json` が `fixture-rag.js` を生成物として説明する。
- [x] `docs/ops/local-verification.md` と `Taskfile.yml` が新しい検証導線を説明する。
- [x] `npm run rag:quality:check`、`npm run rag:security:check`、`npm run rag:aws-binding:check` が pass する。
- [x] `npm run check:no-src-js`、`npm run check:static`、`npm run ci:check`、`git diff --check` が pass する。
- [x] PR に受け入れ条件確認コメントとセルフレビューコメントを日本語で投稿する。

PR コメント:

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4581931563
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/6#issuecomment-4581931622

## 検証計画

- `npm run rag-core:generate`
- `npm run rag-core:check`
- `npm run typecheck:source`
- `npm run rag:quality:check`
- `npm run rag:security:check`
- `npm run rag:aws-binding:check`
- `npm run check:no-src-js`
- `npm run check:static`
- `npm run ci:check`
- `git diff --check`

## PR レビュー観点

- TS 正本と JS mirror の runtime behavior がずれていないこと。
- RAG の根拠性、prompt injection 判定、tool invocation 記録が弱まっていないこと。
- 生成 check が通常の source/type surface 検証で実行されること。
- benchmark 期待語句や QA sample 固有値を本番実装へ持ち込んでいないこと。

## リスク

- TS から JS への生成処理が過度に汎用的だと不要な複雑化を招く。今回は対象 file 固有の mirror 生成に限定し、生成結果と RAG checks で behavior を確認する。
