# Web Vite build boundary

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-29 10:00 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

`plan-20260529.txt` では、`apps/web` を React + Vite + TypeScript package として成立させることが受け入れ条件に含まれる。現状は React source と Vite dependency はあるが、`index.html`、Vite config、browser entrypoint が無く、production build は未検証として残っている。

## 目的

`apps/web` を Vite production build が通る React + TypeScript app package に進める。

## スコープ

- `apps/web/index.html` を追加する。
- Chat/Admin の browser entrypoint を追加する。
- `apps/web/vite.config.ts` を追加し、workspace package alias と build output を定義する。
- build gate を repository static checks へ追加する。
- docs/report に build で確認できることと未実施 runtime を記録する。

## 範囲外

- CloudFront/S3 への実配信。
- Playwright/axe による実ブラウザ UI 検証。
- assistant-ui streaming の実ブラウザ検証。

## 受け入れ条件

- [ ] `npm run build -w @saphnexa/web` が pass する。
- [ ] Vite config / HTML / browser entrypoint が TypeScript source として存在する。
- [ ] Chat/Admin app が build entry から到達できる。
- [ ] 既存 type/Web/docs checks が pass する。
- [ ] 実 CloudFront 配信・実ブラウザ streaming を完了扱いにしない。

## 検証計画

- `npm run build -w @saphnexa/web`
- `npm run typecheck`
- `npm run ui:check`
- `npm run web:flow:check`
- `npm run web:a11y:check`
- `npm run docs:check`
- `git diff --check`

## PR レビュー観点

- Vite build が workspace source を直接参照でき、bundle だけのために runtime contract を変えていないこと。
- Chat/Admin routing が demo fallback や固定データを追加していないこと。
- 実配信・実ブラウザ検証の未実施を明記すること。
