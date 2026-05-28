# TypeScript framework implementation

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-29 08:43 JST
- 対象ブランチ: `codex/typescript-framework-implementation`

## 背景

`.workspace/plan-20260529.txt` は、`.workspace/Saphnexa_基本設計書_v0.17_package.zip` の基本設計を踏まえ、現状の Saphnexa 実装が API / Agent / Web / UI の TypeScript framework 実装としてまだ scaffold 段階であると判定している。

## 目的

AWS dev/UAT preflight 前に、既存の JS scaffold と最小 TSX skeleton を、Hono + Zod OpenAPI、AgentCore Runtime 互換 HTTP contract、React + Vite + TypeScript、TanStack Query、assistant-ui runtime adapter、Atomic Design UI package の方向へ進める。

## スコープ

- `apps/api` を TypeScript Hono app factory / OpenAPI route catalog へ移行する。
- `apps/tools-api` を TypeScript Hono tools endpoint 実装へ移行する。
- `apps/agent` に `/ping` と `/invocations` を持つ TypeScript runtime app と RAG policy guard を置く。
- `apps/web` の package 依存・scripts を React + Vite + TypeScript 前提にし、Chat/Admin の構造を hooks / features / pages へ寄せる。
- `packages/ui` を Atoms / Molecules / Organisms / Templates へ分割し、vanilla-extract 方針の theme entry を保つ。
- 必要な docs / report / task state を更新する。

## 範囲外

- 実 AWS DSQL / Bedrock / Cognito / AppSync Events への接続完了。
- 本番 deploy、AWS account への変更、外部 state の変更。
- 全受入パッケージの外部証跡確定。

## 実施計画

1. 既存 API / Agent / Tools / Web / UI の scaffold を読み、設計上必要な module 境界を確認する。
2. package scripts と TS config を追加し、TypeScript compilation の対象を明確化する。
3. API / Tools API / Agent の TypeScript entry と typed local adapters を追加する。
4. Web を Atomic UI と query hooks を使う構成へ分割する。
5. Durable docs と作業レポートを更新する。
6. 最小十分な検証を実行し、失敗時は修正して再実行する。
7. commit / push / PR 作成 / 受け入れ条件コメント / セルフレビューコメントを完了する。

## ドキュメント保守方針

- API contract、Web 構造、Agent runtime contract に影響があるため、既存 docs から関連箇所を探し、必要最小限の durable docs を更新する。
- 一時的な判断・未対応事項は `reports/working/` に記録する。

## 受け入れ条件

- [x] `apps/api` が Hono + Zod OpenAPI の TypeScript 実装入口を持つ。
- [x] `apps/agent` が AgentCore Runtime 用 TypeScript app と `/ping`、`/invocations` contract を持つ。
- [x] `apps/tools-api` が TypeScript Hono tools API 実装入口を持つ。
- [x] `apps/web` が React + Vite + TypeScript package として成立し、Chat/Admin が hooks / feature components / pages に分割される。
- [x] `packages/ui` が Atomic Design 階層と vanilla-extract 方針の primitives を持つ。
- [x] Chat UI が assistant-ui runtime adapter 境界を持つ。
- [x] Admin UI が DataTable / Form / Dialog / Drawer 相当の共通 UI organism を使う。
- [x] TanStack Query で API state を管理する hook 境界を持つ。
- [x] API schema / model catalog / tool contract / domain store の既存共有境界を壊さない。
- [x] TypeScript compilation または repo の型 surface check を実行し、結果を記録する。
- [x] 未導入の実 AWS 接続や未実施検証は、実施済み扱いせず PR / report に明記する。

## 完了時確認

- PR: https://github.com/tsuji-tomonori/saphnexa/pull/3
- 受け入れ条件コメント: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4569284119
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4569285640
- 作業レポート: `reports/working/20260529-0853-typescript-framework-implementation.md`

## 検証計画

- `npm run typecheck`
- `npm run test:contract`
- `npm run ui:check`
- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run scan:bundle-domains`
- `git diff --check`

## PR レビュー観点

- docs と実装の同期。
- 変更範囲に見合う TypeScript / contract / UI static validation。
- RAG の根拠性・認可境界を弱めていないこと。
- benchmark 期待語句、QA sample 固有値、dataset 固有分岐を実装に入れていないこと。
- 本番 UI に固定 mock data / demo fallback を混ぜていないこと。

## リスク

- 実 AWS 接続は範囲外のため、今回の TypeScript framework 化は local adapter と contract 境界までに留まる。
- 依存追加は package manifest 上の整備であり、network 制約により `npm install` が必要になる場合は別途確認が必要。
