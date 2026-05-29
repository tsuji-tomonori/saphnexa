# UI vanilla-extract / Radix primitives boundary 作業レポート

## 受けた指示

- `main` を pull してから作業する。
- `.workspace` の基本設計と `plan-20260529.txt` に基づき、TypeScript framework 実装化を前進させる。
- Worktree Task PR Flow、task md、検証、PR コメント、作業レポート規約に従う。

## 要件整理

- `madr-0001-frontend-ui-styling-strategy_v0.2.md` の shadcn/ui 系、Radix UI primitives、vanilla-extract recipes / theme contract 方針を UI package の source と gate に入れる。
- 既存 `@saphnexa/ui` API と Chat/Admin 利用を壊さない。
- apps/web に独自 styling を増やさず、UI package 側の recipe class に寄せる。
- 実ブラウザ visual regression は今回の検証済み扱いにしない。

## 検討・判断

- 全 shadcn/ui component 群や dark/density theme の完全実装は範囲が大きいため、今回は UI 基盤の退化防止に効く theme contract、recipe、Radix Dialog primitive の source boundary を追加した。
- Vite build に vanilla-extract plugin を追加し、CSS asset が実際に production build output へ出ることを gate で確認する形にした。
- `Dialog` と `Drawer` は既存の `open` / `title` / `children` API を維持しつつ、Radix Dialog primitive に置き換えた。

## 実施作業

- `@saphnexa/ui` に `@vanilla-extract/recipes` と `@radix-ui/react-dialog` を追加した。
- `@saphnexa/web` に `@vanilla-extract/vite-plugin` を追加し、`apps/web/vite.config.ts` で有効化した。
- `packages/ui/src/theme.css.ts` に `createThemeContract`、light theme、`buttonRecipe`、`controlRecipe`、`statusBadgeRecipe`、dialog/drawer style class を追加した。
- `Button`、`Input`、`Textarea`、`StatusBadge`、`Panel`、`AppShell` を UI recipe/theme class に接続した。
- `Dialog` / `Drawer` を Radix Dialog primitive ベースへ更新した。
- `tools/check-ui-quality.js`、`tools/check-web-accessibility-report.js`、`tools/check-type-surface.js`、`tools/check-web-build-output.js`、`docs/ops/local-verification.md` を更新した。

## 成果物

- Task: `tasks/do/20260529-1336-ui-vanilla-radix-primitives.md`
- UI theme/recipes: `packages/ui/src/theme.css.ts`
- Radix primitive: `packages/ui/src/organisms/Dialog.tsx`, `packages/ui/src/organisms/Drawer.tsx`
- Build plugin: `apps/web/vite.config.ts`
- 作業 branch: `codex/typescript-framework-implementation`

## 検証

- PASS: `npm run typecheck -w @saphnexa/ui`
- PASS: `npm run typecheck -w @saphnexa/web`
- PASS: `npm run ui:check`
- PASS: `npm run web:a11y:check`
- PASS: `npm run typecheck:source`
- PASS: `npm run docs:check`
- PASS: `npm run web:build:check`
- PASS: `git diff --check`

## Fit 評価

- 受け入れ条件のうち、theme contract / recipe source、主要 UI primitive の recipe 接続、Radix Dialog primitive、source/UI/docs/build gate、選定検証の pass を満たした。
- 実ブラウザ visual regression、dark/density theme の実切替、全 shadcn/ui component 群の網羅は未実施として docs と本レポートに残した。

## 未対応・制約・リスク

- dark theme / density theme の完成実装は未対応。
- Tooltip、Tabs、Select、Toast、Dropdown Menu など全 shadcn/ui 系 component 群は未対応。
- Playwright / axe / visual regression による実 DOM と見た目の確認は未実施。
