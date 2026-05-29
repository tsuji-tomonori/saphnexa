# Web Vite build boundary 作業レポート

## 受けた指示

- `.workspace` の基本設計と `plan-20260529.txt` をもとに、TypeScript framework 実装をさらに進める。
- main を fetch してから作業する。
- 未実施の実配信・実ブラウザ検証を完了扱いにしない。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | `npm run build -w @saphnexa/web` が pass する | 対応 |
| R2 | Vite config / HTML / browser entrypoint が存在する | 対応 |
| R3 | Chat/Admin app が build entry から到達できる | 対応 |
| R4 | 既存 type/Web/docs checks が pass する | 対応 |
| R5 | 実 CloudFront 配信・実ブラウザ streaming を完了扱いにしない | 対応 |

## 検討・判断の要約

- `apps/web` は Vite dependency と build script を持っていたが、`index.html`、`vite.config.ts`、browser entrypoint が無く、production build は未検証だった。
- workspace package は Vite alias で `@saphnexa/api-client` と `@saphnexa/ui` の source へ解決する形にした。
- browser entrypoint は `mountSaphnexaWebApp` を export し、`/admin` path では Admin、それ以外では Chat を mount する。
- `react-dom/client` の型解決に必要な `@types/react-dom` と `@types/react` を web workspace devDependency に追加した。

## 実施作業

- `apps/web/index.html` を追加した。
- `apps/web/vite.config.ts` を追加した。
- `apps/web/src/main.tsx` を追加した。
- root `package.json` に `web:build` script を追加した。
- `tools/check-web-flows.js` と `tools/check-type-surface.js` に Vite browser entry の static gate を追加した。
- `docs/ops/local-verification.md` に Vite production build の確認範囲を追記した。

## 検証結果

- `npm run build -w @saphnexa/web`: pass。`apps/web/dist` に production bundle を生成。
- `npm run typecheck`: pass。
- `npm run ui:check`: pass。
- `npm run web:flow:check`: pass。
- `npm run web:a11y:check`: pass。
- `npm run docs:check`: pass。
- `git diff --check`: pass。

## 成果物

| 成果物 | 内容 |
|---|---|
| `apps/web/index.html` | Vite HTML entry |
| `apps/web/vite.config.ts` | React plugin と workspace alias |
| `apps/web/src/main.tsx` | Chat/Admin browser mount entry |
| `package.json` | `web:build` script |
| `docs/ops/local-verification.md` | Vite production build の検証範囲 |

## Fit 評価

総合fit: 4.6 / 5.0（約92%）

理由: plan の React + Vite + TypeScript package 成立に対し、実 Vite production build を通す状態まで進めた。CloudFront/S3 実配信、Playwright/axe 実 DOM、assistant-ui streaming 実ブラウザ挙動は未実施のため満点ではない。

## 未対応・制約・リスク

- `apps/web/dist` は build output として `.gitignore` 対象であり commit しない。
- CloudFront/S3 への実配信は未実施。
- 実ブラウザでの chat/admin E2E、assistant-ui streaming、AppSync Events subscribe は未実施。
