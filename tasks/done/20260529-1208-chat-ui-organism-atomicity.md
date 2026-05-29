# Chat UI organism atomicity

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-29 12:08 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` は、フロントエンドが React + Vite + TypeScript、assistant-ui、vanilla-extract、TanStack Query、React Hook Form + Zod、Atomic Design へ進む必要があるとしている。現状は Atoms/Molecules/一部 Organisms/Templates はあるが、Chat UI では navigation と event thread が feature component 側に薄く残り、`Sidebar` / `MessageThread` のような Atomic Design organism が不足している。

## 目的

Chat UI の構造を Atomic Design に一段寄せ、共通 UI package に `Sidebar` と `MessageThread` organism を追加し、Chat page がそれらを通して実データ由来の navigation/event 表示を行うようにする。

## スコープ

- `packages/ui/src/organisms/Sidebar.tsx` を追加し、labelled navigation container を提供する。
- `packages/ui/src/organisms/MessageThread.tsx` を追加し、event rows の labelled thread と honest empty state を提供する。
- `ChatSessionNav` と `MessageEventsPanel` を新 organism 経由に変更する。
- UI barrel、source gate、docs、report を更新する。
- 実 assistant-ui streaming、実 AppSync Events subscribe、視覚E2Eは別 slice とし、完了扱いにしない。

## 実装計画

1. 既存 Chat UI と UI package exports を確認する。
2. `Sidebar` / `MessageThread` organism を追加する。
3. Chat feature components を新 organism 使用へ移行する。
4. source gate と docs を更新する。
5. web/ui typecheck、web flow、UI quality、Web build を実行する。

## ドキュメント保守方針

UI挙動の外部契約は変えない。local verification docs には Chat UI の organism 分割確認範囲と、実ブラウザ streaming / AppSync Events 実接続は未対応であることを明記する。

## 受け入れ条件

- [x] `packages/ui` が `Sidebar` と `MessageThread` organism を export する。
- [x] `ChatSessionNav` が labelled `Sidebar` organism を使う。
- [x] `MessageEventsPanel` が `MessageThread` organism を使い、空状態を正直に表示する。
- [x] source gate が Chat UI organism 分割を検査する。
- [x] Web/UI typecheck、Web flow、UI quality、build が pass する。
- [x] 実 assistant-ui streaming / AppSync Events subscribe / 実ブラウザE2Eを完了扱いにしない。

## 検証計画

- `npm run typecheck -w @saphnexa/ui`
- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck`
- `npm run web:flow:check`
- `npm run ui:check`
- `npm run build -w @saphnexa/web`
- `npm run docs:check`
- `git diff --check`

## PR レビュー観点

- Chat UI の navigation/event 表示が共通 organism へ移っていること。
- 空状態や realtime 未接続時に架空データを生成していないこと。
- visual/runtime E2E を過大に完了扱いしていないこと。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4570122364
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4570124266

## 検証結果

- `npm run typecheck -w @saphnexa/ui`: pass。
- `npm run typecheck -w @saphnexa/web`: pass。
- `npm run typecheck`: pass。
- `npm run web:flow:check`: pass。
- `npm run ui:check`: 初回 fail。`MessageEventsPanel` の空状態が `MessageThread` organism に移ったため、source gate 期待値を更新後 pass。
- `npm run build -w @saphnexa/web`: pass。
- `npm run docs:check`: pass。
- `git diff --check`: pass。

## リスク・制約

- 実 assistant-ui streaming と AppSync Events subscribe は未実施。
- このsliceは構造とsource/local build gateに限定する。
