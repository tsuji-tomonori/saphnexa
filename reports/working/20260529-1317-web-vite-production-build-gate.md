# Web Vite production build gate 作業レポート

## 受けた指示

- `.workspace/plan-20260529.txt` と `.workspace/Saphnexa_基本設計書_v0.17_package.zip` を前提に、TypeScript framework 実装の未達項目を進める。
- 作業前に `main` を更新する。
- Repository workflow に従い、task md、検証、commit/PR 更新、PR コメント、作業レポートを残す。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | Vite production build を再実行可能な gate にする | 対応 |
| R2 | build output の index.html / JS asset / sourcemap / gzip size を検査する | 対応 |
| R3 | source gate と docs を同期する | 対応 |
| R4 | 実ブラウザ streaming / AppSync Events 実接続を実施済み扱いしない | 対応 |

## 検討・判断の要約

- `plan-20260529.txt` の Web 受け入れ条件には React + Vite + TypeScript package と production build が含まれている。
- 既存の `npm run web:build` は成功したが、build output を検査する gate がなかったため、`web:build:check` を追加した。
- Vite の hashed asset 名は build ごとに変わるため、固定ファイル名ではなく `apps/web/dist/assets/*.js` を検査対象にした。
- `apps/web/dist` は build output であり、`.gitignore` 対象のまま commit しない方針とした。
- 今回の検証は production bundle artifact の存在・サイズ確認であり、実ブラウザ streaming や AppSync Events 実接続の証跡ではない。

## 実施作業

- `tools/check-web-build-output.js`
  - root `web:build` script の内容を確認。
  - `apps/web/dist/index.html` と `apps/web/dist/assets` の存在を確認。
  - built JS asset、JS sourcemap、gzip size 上限、empty asset でないことを確認。
- `package.json`
  - `web:build:check` を追加。
- `tools/check-type-surface.js`
  - `web:build` / `web:build:check` script と build output check script の source token を検査。
- `tools/check-docs.js`
  - `docs/ops/local-verification.md` に `npm run web:build:check` が記載されていることを検査。
- `docs/ops/local-verification.md`
  - Vite production build output check の確認範囲と未検証範囲を追記。

## 成果物

| 成果物 | 内容 |
|---|---|
| `tools/check-web-build-output.js` | Vite build output 検査 script |
| `package.json` | `web:build:check` script |
| `tools/check-type-surface.js` | source gate 更新 |
| `tools/check-docs.js` | docs gate 更新 |
| `docs/ops/local-verification.md` | local verification docs 更新 |

## 実行した検証

- `npm run web:build`: pass。作業前の現状確認として実行。
- `npm run web:build:check`: pass。
- `npm run typecheck -w @saphnexa/web`: pass。
- `npm run typecheck:source`: pass。
- `npm run docs:check`: pass。
- `npm run typecheck`: pass。
- `npm run web:bundle:check`: pass。
- `git diff --check`: pass。

## 未実施・制約・リスク

- 実ブラウザでの assistant-ui streaming 動作は未実施。
- 実 AppSync Events subscribe / WebSocket 接続成功は未実施。
- Lighthouse CI / production analyzer report は未実施。今回の gate は Vite output と gzip size のローカル検査に留まる。

## 指示への fit 評価

総合fit: 4.4 / 5.0（約88%）

理由: Web/Vite production build の成立性を単発確認から再実行可能な gate に引き上げ、docs/source gate と同期した。一方、実ブラウザ streaming と AWS realtime 接続は未実施のため満点ではない。
