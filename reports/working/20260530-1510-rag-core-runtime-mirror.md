# RAG core runtime mirror generation report

## 指示

- `.workspace/plam-20260530-01.txt` に対応する継続作業として、TS 正本化と source JS transition gate を前進させる。
- repository local rules に従い、task md、検証、作業レポート、commit / PR コメントまで実施する。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | `packages/rag-core/src/fixture-rag.ts` を正本にし、`.js` runtime mirror を生成物化する | 対応 |
| R2 | drift check を npm script / Taskfile / source gate へ組み込む | 対応 |
| R3 | RAG quality / security / AWS binding を維持する | 対応 |
| R4 | source JS allowlist と local verification docs を更新する | 対応 |
| R5 | 実施していない検証を実施済み扱いしない | 対応 |

## 検討・判断

- `fixture-rag.ts` は RAG adapter / local tools / prompt injection 判定の型付き source として存在していたため、JS 側を手書き正本のまま保つより生成 mirror へ移す方針を採った。
- generator は対象ファイル固有に限定し、interface 除去と runtime signature の最小変換だけを行う。汎用 TS transpiler もどきにはせず、既存の repository generator pattern に合わせた。
- 生成 JS は TS source の条件付き `retrieval_policy` 付与に揃えた。手書き JS の `retrieval_policy: undefined` 常時付与との差分は、TS 正本化に伴う mirror drift 解消として扱った。
- README / API docs は runtime behavior や利用者向け API の変更ではないため更新不要と判断し、運用検証 docs のみ更新した。

## 実施作業

- `tools/generate-rag-core-runtime-mirror.js` を追加した。
- `packages/rag-core/src/fixture-rag.js` を生成 header 付き mirror に更新した。
- `package.json` に `rag-core:generate` / `rag-core:check` を追加した。
- `Taskfile.yml` に `rag-core:generate` / `rag-core:check` task を追加した。
- `tools/check-type-surface.js` に RAG core mirror drift check を統合した。
- `tools/source-js-allowlist.json` の `fixture-rag.js` 理由を generated runtime mirror に更新した。
- `docs/ops/local-verification.md` に RAG core mirror check を追記した。
- `tasks/do/20260530-1510-rag-core-runtime-mirror.md` に受け入れ条件と検証計画を記録した。

## 成果物

| 成果物 | 内容 |
|---|---|
| `tools/generate-rag-core-runtime-mirror.js` | RAG core TS source から JS runtime mirror を生成・検査する script |
| `packages/rag-core/src/fixture-rag.js` | generated header 付き runtime mirror |
| `package.json` / `Taskfile.yml` | 生成・検査コマンド |
| `tools/check-type-surface.js` | source gate への mirror check 統合 |
| `tools/source-js-allowlist.json` | allowlist 理由更新 |
| `docs/ops/local-verification.md` | local verification docs 更新 |
| `tasks/do/20260530-1510-rag-core-runtime-mirror.md` | task 管理ファイル |

## 実行した検証

- `npm run rag-core:generate`: pass
- `npm run rag-core:check`: pass
- `npm run typecheck:source`: pass
- `npm run rag:quality:check`: pass
- `npm run rag:security:check`: pass
- `npm run rag:aws-binding:check`: pass
- `npm run check:no-src-js`: pass
- `npm run check:static`: pass
- `npm run ci:check`: pass
- `git diff --check`: pass

## Fit 評価

総合fit: 4.8 / 5.0（約96%）

理由: RAG core mirror の生成化、drift check 統合、関連検証、docs / allowlist 更新は完了した。一方で `.workspace/plam-20260530-01.txt` 全体に対する残作業として、他の source JS mirror 化、本番 strict gate、production-ready implementation coverage の planned marker 解消は残っている。

## 未対応・制約・リスク

- 未対応: 残存 source JS 全体の削除や production-ready strict gate 化は今回の task scope 外。
- 制約: AWS dev/UAT 実接続、Bedrock KB / S3 Vectors / AgentCore 実行は未実施。
- リスク: generator は `fixture-rag.ts` 固有の構造に依存する。対象 source の形を大きく変える場合は generator の assertion 更新が必要になる。
