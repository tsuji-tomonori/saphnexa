# Web Vite production build gate

## 背景

`plan-20260529.txt` では、`apps/web` が React + Vite + TypeScript package として成立し、Vite production build を実行できることが受け入れ条件に含まれている。
現状の `npm run web:build` は成功するが、build output を検査する repository gate がなく、Vite production build の成果を CI/レビューで再確認しにくい。

## 目的

Vite production build の出力を検査する `web:build:check` を追加し、Chat/Admin browser entrypoint の bundle 成立性を再実行可能な gate として固定する。

## タスク種別

機能追加

## スコープ

- `npm run web:build` 実行後の `apps/web/dist` を検査する script を追加する。
- root `package.json` に `web:build:check` script を追加する。
- source gate と `docs/ops/local-verification.md` に build output check を反映する。
- 実ブラウザ streaming、AppSync Events 実接続、Lighthouse/Playwright は今回の対象外とする。

## 実装計画

1. `tools/check-web-build-output.js` を追加し、`dist/index.html` と JS asset / sourcemap / gzip size を検査する。
2. root `package.json` に `web:build:check` を追加する。
3. `tools/check-type-surface.js` と docs を更新する。
4. `npm run web:build:check` と関連検証を実行する。

## ドキュメントメンテナンス計画

`docs/ops/local-verification.md` に、Vite production build output を source-level ではなく実 build artifact として検査すること、ただし実ブラウザ streaming / AppSync Events 接続ではないことを明記する。

## 受け入れ条件

- [ ] `npm run web:build:check` が Vite build を実行し、`apps/web/dist/index.html` と JS asset を検査する。
- [ ] build output check が JS sourcemap と gzip size の上限を検査する。
- [ ] source gate が `web:build:check` script と check script の存在を検査する。
- [ ] docs が Vite production build output と未検証の実ブラウザ/AWS 接続範囲を区別する。
- [ ] 選定した検証コマンドが pass し、実ブラウザ streaming / AppSync Events 実接続を実施済み扱いしていない。

## 検証計画

- `npm run web:build:check`
- `npm run typecheck -w @saphnexa/web`
- `npm run typecheck:source`
- `npm run docs:check`
- `git diff --check`

## PR レビュー観点

- build output を commit せず、再生成可能な検証だけを追加していること。
- gzip size gate が過度に厳しすぎず、かつ異常な bundle 肥大を検出できること。
- 実ブラウザ streaming / AppSync Events 実接続を実施済み扱いしていないこと。

## リスク

- asset hash は Vite build ごとに変わるため、固定ファイル名ではなく `dist/assets/*.js` を検査する。
- production analyzer / Lighthouse CI ではないため、性能検証は gzip size と route transition source report に留まる。

## 状態

do
