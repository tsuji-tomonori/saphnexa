# Web citation realtime form

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-29 09:49 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` では、フロントエンドは React + Vite + TypeScript に加え、assistant-ui、shadcn/ui 系 primitives、vanilla-extract、TanStack Query、React Hook Form + Zod、Citation Drawer、AppSync Events client 境界へ進める必要があるとされている。現状は assistant adapter と TanStack Query hook はあるが、Citation Drawer、realtime client 境界、form validation は薄い。

## 目的

Chat UI を、実データ由来の citation drawer、realtime client 境界、React Hook Form + Zod validation を持つ TypeScript UI 実装へ進める。

## スコープ

- `react-hook-form` と `@hookform/resolvers` を導入する。
- MessageComposer を React Hook Form + Zod validation で実装する。
- citation drawer organism / feature を追加し、message events payload から citation を表示する。
- AppSync Events / WebSocket の実接続前提を分離した realtime client boundary を追加する。
- Web/UI/source gates と docs/report を更新する。

## 範囲外

- AppSync Events の実 subscribe。
- assistant-ui streaming の実ブラウザ検証。
- Citation source の PDF page jump 実装。

## 受け入れ条件

- [ ] MessageComposer が React Hook Form + Zod validation を使う。
- [ ] Chat UI が citation drawer を共通 UI / feature component として持ち、表示値は events payload 由来である。
- [ ] Web realtime client boundary が TypeScript source として存在し、実接続未設定時に架空イベントを返さない。
- [ ] Web/UI/type checks が pass する。
- [ ] AppSync Events 実接続と assistant-ui streaming 実ブラウザ挙動を完了扱いにしない。

## 検証計画

- `npm install`
- `npm run typecheck`
- `npm run ui:check`
- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run docs:check`
- `git diff --check`

## PR レビュー観点

- citation が固定値や demo fallback ではなく events payload から導出されること。
- realtime boundary が未接続時に fake event を生成しないこと。
- form validation が本番 UI の honest disabled/error state と矛盾しないこと。
