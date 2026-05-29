# Admin tabs Radix UI boundary

## 背景

`.workspace` の基本設計では、管理 UI がユーザー取込、文書登録、取り込み監視、RAG 評価、公開成果物閲覧を扱う。
現行 PR #3 では Admin Dashboard に評価操作と成果物一覧があるが、画面内の管理領域は直列配置であり、`madr-0001-frontend-ui-styling-strategy_v0.2.md` が求める shadcn/ui 系の Tabs 操作体系はまだ source として入っていない。

## 目的

Radix Tabs ベースの共通 UI organism を追加し、Admin Dashboard を実データ由来の「評価」「成果物」タブに分けて、管理 UI の画面構造を基本設計に近づける。

## タスク種別

機能追加

## スコープ

- `packages/ui` に Radix Tabs primitive ベースの `Tabs` organism を追加する。
- Admin Dashboard で `Tabs` を使い、既存の評価操作と成果物一覧をタブで切り替える。
- 架空ユーザー、架空文書、架空件数、demo fallback は追加しない。
- UI/source/a11y/docs gate を更新し、Radix Tabs 境界を検査する。
- 実ブラウザ visual regression や全管理機能の backend 実装は今回の対象外とする。

## 実装計画

1. `@saphnexa/ui` に `@radix-ui/react-tabs` を追加する。
2. `packages/ui/src/organisms/Tabs.tsx` と theme recipe/style を追加する。
3. UI barrel export と Admin Dashboard の利用を更新する。
4. `tools/check-ui-quality.js`、`tools/check-web-accessibility-report.js`、`tools/check-type-surface.js`、docs を更新する。
5. UI/Web typecheck、source/UI/a11y/docs/build/diff check を実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Admin Dashboard が Radix Tabs / Saphnexa UI package 経由で管理領域を分割する source gate を持つことを追記する。

## 受け入れ条件

- [ ] `packages/ui` が Radix Tabs primitive ベースの `Tabs` organism を持つ。
- [ ] `AdminDashboardPage` が評価操作と成果物一覧を `Tabs` で分割し、既存 API hook と empty state を維持する。
- [ ] 架空ユーザー、架空文書、架空件数、demo fallback を追加しない。
- [ ] UI/source/a11y/docs gate が Admin Tabs と Radix Tabs 境界を検査する。
- [ ] 選定した検証コマンドが pass し、実ブラウザ visual regression を実施済み扱いしない。

## 検証計画

- `npm run typecheck -w @saphnexa/ui`
- `npm run typecheck -w @saphnexa/web`
- `npm run ui:check`
- `npm run web:a11y:check`
- `npm run typecheck:source`
- `npm run docs:check`
- `npm run web:build:check`
- `git diff --check`

## PR レビュー観点

- Tabs が Radix primitive と UI package recipe に基づき、apps/web へ独自 styling を増やしていないこと。
- Admin Dashboard が既存の実データ hook と正直な empty state を維持していること。
- backend 未実装のユーザー取込・文書登録を架空 UI で実装済みに見せていないこと。

## リスク

- この slice は Admin 画面構造の前進であり、ユーザー取込や文書登録 API/UI の完全実装ではない。
- Radix Tabs 導入により DOM 構造が変わるため、source gate と build/typecheck で API 互換を確認する。

## 状態

do
