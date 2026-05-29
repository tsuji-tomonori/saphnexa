# RAG core TypeScript source

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-29 10:10 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` では、RAG core はまだ `.js` 中心であり、API / Agent / Tools 境界を TypeScript 実装へ進める必要があるとされている。現状 `packages/rag-core/src/fixture-rag.js` は runtime として機能しているが、型付き source of record がなく、`tsconfig` も JS のみを include している。

## 目的

RAG fixture adapter と local tools 境界を TypeScript source として定義し、既存 JS runtime mirror と同期していることを source gate で確認する。

## スコープ

- `packages/rag-core/src/fixture-rag.ts` を追加し、RAG fixture/tools の型を定義する。
- `packages/rag-core/tsconfig.json` と root typecheck 対象に TS source を含める。
- `tools/check-type-surface.js` に RAG core TS/source sync gate を追加する。
- docs/report に TS source 化の範囲と runtime mirror の制約を記録する。

## 範囲外

- 既存 Node local tests の `.js` runtime mirror 廃止。
- 実 Bedrock KB / S3 Vectors / AgentCore Gateway 接続。
- RAG 評価の AWS 実行。

## 受け入れ条件

- [x] `packages/rag-core/src/fixture-rag.ts` が typed RAG adapter/tools boundary を export する。
- [x] RAG core TS source が `npm run typecheck` の実 `tsc` 対象に含まれる。
- [x] source gate が TS source と JS runtime mirror の主要 tool/policy token 同期を確認する。
- [x] RAG security / quality 関連 checks が pass する。
- [x] 実 Bedrock / AgentCore Gateway / S3 Vectors 接続を完了扱いにしない。

## 検証計画

- `npm run typecheck`
- `npm run rag:security:check`
- `npm run rag:quality:check`
- `npm run test:contract`
- `npm test`
- `npm run docs:check`
- `git diff --check`

## 検証結果

- `npm run typecheck`: pass。
- `npm run rag:security:check`: pass。20/20 cases。
- `npm run rag:quality:check`: pass。
- `npm run test:contract`: pass。
- `npm test`: pass。15 tests。
- `npm run docs:check`: pass。
- `git diff --check`: pass。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4569631423
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4569633254

## PR レビュー観点

- TS source が既存 RAG 認可境界、prompt injection refusal、citation binding を弱めていないこと。
- JS runtime mirror と TS source の主要 tool 名・関数名が同期していること。
- 実 AWS 接続未実施を完了扱いにしていないこと。
