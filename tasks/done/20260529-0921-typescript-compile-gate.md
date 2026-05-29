# TypeScript compile gate

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-29 09:21 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` では、API / Agent / Web / UI が TypeScript 設計として未完成であり、`npm run typecheck` が実 TypeScript compilation を行う状態が次段階として挙げられている。これまでの PR #3 では source gate と TS source を追加したが、依存未導入のため実 `tsc` compilation は未実施だった。

## 目的

依存解決と実 TypeScript compile gate を追加し、TypeScript source が `tsc` で検証できる状態へ進める。

## スコープ

- npm workspace 依存を解決し、必要なら lockfile を追加する。
- root `typecheck` を source gate と実 `tsc --build` の両方を実行する形へ更新する。
- TypeScript project references に必要な workspace を追加する。
- 実 `tsc` で出る型エラーを修正する。
- docs/report に実施結果と残制約を記録する。

## 範囲外

- Vite production build の完全対応。
- 実 AWS runtime 接続。
- OpenAPI / DB 自動 codegen の本導入。

## 実施計画

1. `npm install` で依存を解決する。
2. `npm run typecheck` を実 `tsc --build` へ拡張する。
3. 型エラーを確認して、必要最小限で修正する。
4. 関連 local tests と docs check を実行する。
5. PR コメント、task done、作業レポートを更新する。

## ドキュメント保守方針

- `docs/ops/local-verification.md` に実 TypeScript compile gate の確認範囲を追記する。
- 一時的な判断と未対応事項は `reports/working/` に記録する。

## 受け入れ条件

- [ ] lockfile または依存解決結果がリポジトリに残る。
- [ ] root `npm run typecheck` が source gate と実 TypeScript compilation を実行する。
- [ ] `tsc` 実行時の型エラーが解消される。
- [ ] 既存 contract / unit / docs checks が pass する。
- [ ] Vite build、実 AWS 接続、codegen 未実施を完了扱いにしない。

## 検証計画

- `npm run typecheck`
- `npm run test:contract`
- `npm test`
- `npm run docs:check`
- `git diff --check`

## PR レビュー観点

- source gate と実 TypeScript compilation の両方が維持されていること。
- 型エラー修正が runtime contract を狭めたり、RAG 認可境界を弱めたりしていないこと。
- lockfile 追加が意図しない依存を大量に増やしていないこと。

## リスク

- network / registry 制約で依存解決が blocked になる可能性がある。
- 実 Vite build までは範囲外のため、React app runtime の完全検証は後続になる。
