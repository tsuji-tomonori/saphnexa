# UI vanilla-extract / Radix primitives boundary

## 背景

`plan-20260529.txt` は Frontend / UI の未達として、shadcn/ui 系、vanilla-extract、Atomic Design の本実装不足を挙げている。
PR #3 では Atomic Design の分割、Chat/Admin organisms、assistant-ui runtime provider 境界までは進んだが、`.workspace` の `madr-0001-frontend-ui-styling-strategy_v0.2.md` が求める `createThemeContract`、`@vanilla-extract/recipes`、Radix UI primitives の境界はまだ source として弱い。

## 目的

Saphnexa 共通 UI package に、shadcn/ui 系の variant 設計と Radix primitive 方針を TypeScript source と source gate で確認できる最小実装として追加する。

## タスク種別

機能追加

## スコープ

- `packages/ui` に vanilla-extract theme contract と recipe boundary を追加する。
- `Button`、`Input`、`Textarea`、`StatusBadge` など主要 primitive/molecule が recipe class を使うようにする。
- `Dialog` / `Drawer` を Radix Dialog primitive に寄せ、既存の open/title/children API は維持する。
- UI/source/docs gate を更新し、ADR の境界が退化しないようにする。
- アプリ独自の色・余白・角丸を新規追加しない。

## 実装計画

1. `@vanilla-extract/recipes` と Radix Dialog dependency を `@saphnexa/ui` に追加する。
2. `packages/ui/src/theme.css.ts` を theme contract / light theme / recipes を持つ source に拡張する。
3. UI primitive / organism の class を recipe export に寄せる。
4. `tools/check-ui-quality.js` と `tools/check-type-surface.js`、docs を更新する。
5. UI typecheck、source/UI/docs/build 系の必要検証を実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、UI package の vanilla-extract recipe / Radix Dialog primitive 境界が source gate で確認されることを追記する。

## 受け入れ条件

- [ ] `packages/ui` が `createThemeContract` と `@vanilla-extract/recipes` の recipe source を持つ。
- [ ] `Button` / form control / `StatusBadge` が UI package の recipe class を使い、apps/web へ独自 styling を増やさない。
- [ ] `Dialog` / `Drawer` が Radix Dialog primitive に基づく実装を持ち、既存の title/open API と a11y 意味を維持する。
- [ ] UI/source/docs gate が vanilla-extract recipe と Radix primitive 境界を検査する。
- [ ] 選定した検証コマンドが pass し、未実施の実ブラウザ visual regression を実施済み扱いしない。

## 検証計画

- `npm run typecheck -w @saphnexa/ui`
- `npm run typecheck -w @saphnexa/web`
- `npm run ui:check`
- `npm run typecheck:source`
- `npm run docs:check`
- `npm run web:build:check`
- `git diff --check`

## PR レビュー観点

- ADR の「Radix UI primitives」「vanilla-extract recipes」「theme contract」方針が source と gate に入っていること。
- 既存 `@saphnexa/ui` exports と apps/web の API を壊していないこと。
- 実ブラウザの visual regression は未実施として明記されていること。

## リスク

- この slice は UI 基盤境界の最小化であり、全 shadcn/ui component 群や dark/density theme の完全実装ではない。
- Radix Dialog への置き換えで DOM 構造が変わるため、source gate と build/typecheck で API 互換を確認する。

## 状態

do
