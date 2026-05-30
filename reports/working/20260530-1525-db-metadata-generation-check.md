# DB metadata generation drift check report

## 指示

- `.workspace/plam-20260530-01.txt` に対応する継続作業として、TypeScript source-of-truth 化と source JS transition gate を前進させる。
- repository local rules に従い、task md、検証、作業レポート、commit / PR コメントまで実施する。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | DB metadata `.js` / `.ts` を migration source 由来の生成物として check 可能にする | 対応 |
| R2 | `db:metadata:check` と `typecheck:source` に drift check を組み込む | 対応 |
| R3 | source JS allowlist で `table-metadata.js` を generated surface と説明する | 対応 |
| R4 | local verification docs を更新する | 対応 |
| R5 | 実施していない検証を実施済み扱いしない | 対応 |

## 検討・判断

- `packages/db-schema/src/table-metadata.js` は既に `tools/build-db-metadata-source.js` の生成物だったが、`--check` がなく drift 検出が弱かったため、生成 script 自体に check mode を追加した。
- check mode はファイルを書き換えず、生成予定内容と committed `table-metadata.js` / `.ts` を比較する形にした。
- `db:metadata:check` と `typecheck:source` の両方で check mode を呼び、DB metadata の通常検証と source surface gate の両方から drift を検出できるようにした。
- 実 DSQL introspection や Flyway 実適用は今回の scope 外として、docs でもローカル static metadata check と実環境検証の違いを明記した。

## 実施作業

- `tools/build-db-metadata-source.js` に `--check` を追加した。
- `tools/check-db-metadata.js` に DB metadata source drift check を統合した。
- `tools/check-type-surface.js` に DB metadata source drift check を統合した。
- `Taskfile.yml` に `db:metadata:build` を追加し、`db:metadata:check` の説明を生成物 check に更新した。
- `tools/source-js-allowlist.json` の `packages/db-schema/src/table-metadata.js` 理由を generated runtime compatibility DB metadata surface に更新した。
- `docs/ops/local-verification.md` に DB metadata 生成・drift check の説明を追加した。
- `tasks/do/20260530-1525-db-metadata-generation-check.md` に受け入れ条件と検証計画を記録した。

## 成果物

| 成果物 | 内容 |
|---|---|
| `tools/build-db-metadata-source.js` | DB metadata `.js` / `.ts` の生成・check mode |
| `tools/check-db-metadata.js` | DB metadata source drift check 統合 |
| `tools/check-type-surface.js` | source gate への DB metadata source drift check 統合 |
| `Taskfile.yml` | `db:metadata:build` と check 説明 |
| `tools/source-js-allowlist.json` | generated metadata surface の allowlist 理由 |
| `docs/ops/local-verification.md` | local verification docs 更新 |
| `tasks/do/20260530-1525-db-metadata-generation-check.md` | task 管理ファイル |

## 実行した検証

- `npm run db:metadata:build`: pass
- `npm run db:metadata:check`: pass
- `npm run typecheck:source`: pass
- `npm run check:no-src-js`: pass
- `npm run check:static`: pass
- `npm run ci:check`: pass
- `git diff --check`: pass

## Fit 評価

総合fit: 4.8 / 5.0（約96%）

理由: DB metadata の generated source drift check、source gate 統合、docs / allowlist 更新は完了した。一方で `.workspace/plam-20260530-01.txt` 全体に対する残作業として、apps/api / tools-api / agent の手書き JS、production-ready implementation coverage、DSQL unmapped operation 解消は残っている。

## 未対応・制約・リスク

- 未対応: 実 DSQL introspection、Flyway 実 DB 適用、DB metadata 内容の再設計は今回の task scope 外。
- 制約: AWS dev/UAT 実接続は未実施。
- リスク: `build-db-metadata-source.js` の生成ロジックは migration SQL と手動 mapping に依存する。新規 table / column 追加時は mapping の妥当性レビューが必要になる。
