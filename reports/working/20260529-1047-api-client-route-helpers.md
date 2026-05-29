# API client route helpers 作業レポート

## 指示

- `.workspace` の基本設計と `plan-20260529.txt` をもとに、TypeScript framework implementation の未達項目を継続して進める。
- 作業前に `main` を pull/fetch してから進める。
- repository local workflow に従い、task md、検証、PR コメント、作業レポートを残す。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | `origin/main` を取得し、作業ブランチが main を取り込んでいることを確認する | 対応 |
| R2 | API contract と Web fetch の共有型境界を強める | 対応 |
| R3 | Web の主要 API 呼び出しを typed route helper 経由にする | 対応 |
| R4 | source gate で API client helper と API contract の主要 operation/path token 同期を確認する | 対応 |
| R5 | OpenAPI generated client 完了や全 38 route helper 網羅を完了扱いにしない | 対応 |

## 検討・判断

- 既存 `apiGet<T>(path: string)` / `apiPost<T>(path: string, ...)` は relative path runtime guard を持つが、TypeScript 上は任意 string を許していた。
- 今回は OpenAPI client 生成までは行わず、Web が実際に使う主要 route を `apiRoutes` helper として定義し、`ApiClientPath` で `/api/*` / `/auth/*` に制約した。
- Web 側は `me`、chat sessions、submit question、message events、ws ticket、admin artifacts、evaluation run の呼び出しを helper 経由へ置き換えた。

## 実施作業

- `packages/api-client/src/client.ts` に `ApiClientPath`、`apiRoutes`、`ApiClientRouteName` を追加。
- `apiGet` / `apiPost` / internal `request` の path 型を `ApiClientPath` に変更。
- Web hooks/pages/assistant runtime の主要 API 呼び出しを `apiRoutes` 経由に変更。
- `tools/check-type-surface.js` に API client helper と API contract の operation/path token 同期検査を追加。
- `docs/ops/local-verification.md` に API client route helper source gate と未完了扱いの範囲を追記。
- `tasks/do/20260529-1043-api-client-route-helpers.md` に受け入れ条件と検証結果を記録。

## 成果物

| 成果物 | 内容 |
|---|---|
| `packages/api-client/src/client.ts` | typed route helper と path-constrained request helper |
| `apps/web/src/**` | 主要 API 呼び出しの route helper 利用 |
| `tools/check-type-surface.js` | API client / API contract token 同期 gate |
| `docs/ops/local-verification.md` | local verification docs 更新 |
| `tasks/do/20260529-1043-api-client-route-helpers.md` | task 記録 |

## 実行した検証

- `npm run typecheck`: pass
- `npm run typecheck -w @saphnexa/api-client`: pass
- `npm run typecheck -w @saphnexa/web`: pass
- `npm run build -w @saphnexa/web`: pass
- `npm run test:contract`: pass
- `npm test`: pass。15 tests。
- `npm run docs:check`: pass
- `git diff --check`: pass

## fit 評価

総合fit: 4.3 / 5.0（約86%）

理由: plan の API schema / frontend-backend shared type 方針に対し、Web の主要 fetch を API contract と同期検査される route helper 経由へ進めた。一方で、OpenAPI からの全 route 自動 client 生成や実 CloudFront/Cognito 経由 HTTP request は未対応のため満点ではない。

## 未対応・制約・リスク

- 全 38 route の generated client は未対応。
- OpenAPI 生成型からの request/response 型導出は未対応。
- 実 CloudFront/Cognito 経由 HTTP request、CSRF cookie integration は未検証。
