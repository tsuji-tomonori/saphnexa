# TypeScript compile gate 作業レポート

## 受けた指示

- `.workspace` の基本設計と `plan-20260529.txt` に基づき、TypeScript framework 実装を前進させる。
- main を pull / fetch してから作業する。
- リポジトリルールに従い、task md、検証、PR コメント、作業レポートを残す。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | npm workspace 依存を解決し、lockfile を残す | 対応 |
| R2 | `npm run typecheck` が source gate と実 TypeScript compilation を実行する | 対応 |
| R3 | `tsc` の型エラーを解消する | 対応 |
| R4 | 既存 contract / unit / docs checks を実行する | 対応 |
| R5 | Vite build、実 AWS 接続、codegen を完了扱いにしない | 対応 |

## 検討・判断の要約

- `origin/main` を fetch し、PR branch が main から遅れていないことを確認した。
- 既存 source gate は維持し、root `typecheck` を `typecheck:source` と `typecheck:ts` の組み合わせに分けた。
- project references の `noEmit` 制約と既存 JS runtime mirror を踏まえ、実 TypeScript compilation は専用 `tsconfig.typecheck.json` の `tsc --noEmit` で行う形にした。
- dynamic route 生成の Hono OpenAPI 境界では status ごとの静的推論が過剰に狭くなるため、登録境界だけを `any` に寄せ、dispatcher と schema builder の型検査は維持した。
- `npm install` の audit 結果では 22 件の脆弱性が報告されたが、今回は依存解決と compile gate が目的のため `npm audit fix` は実行していない。

## 実施作業

- `package-lock.json` を生成し、npm workspace 依存を解決した。
- root `npm run typecheck` を source gate + 実 `tsc --noEmit --project tsconfig.typecheck.json` に更新した。
- API / Tools API / Web / shared packages の import と TypeScript 型定義を調整した。
- `packages/api-contract` と `packages/tool-contract` の TS source に runtime mirror と同じ exported constants を追加した。
- shared packages、domain、rag-core に `tsconfig.json` と `typecheck` script を追加した。
- `docs/ops/local-verification.md` に実 TypeScript compile gate の確認範囲と残制約を追記した。

## 検証結果

- `npm run typecheck`: pass。source gate と `tsc --noEmit --project tsconfig.typecheck.json` が成功。
- `npm run test:contract`: pass。
- `npm run api:openapi:check`: pass。
- `npm run ui:check`: 初回は package import を認識しない checker のため失敗。`@saphnexa/ui` を common UI usage として扱うよう修正後 pass。
- `npm run web:flow:check`: pass。
- `npm run web:a11y:check`: pass。
- `npm test`: pass。15 tests。
- `npm run docs:check`: pass。
- `git diff --check`: pass。

## 成果物

| 成果物 | 内容 |
|---|---|
| `package-lock.json` | npm workspace の依存解決結果 |
| `tsconfig.typecheck.json` | 実 TypeScript compilation 用の no-emit typecheck config |
| `package.json` | `typecheck:source` / `typecheck:ts` / combined `typecheck` |
| `packages/*/tsconfig.json` | shared packages の TypeScript compile 対象化 |
| `docs/ops/local-verification.md` | local verification の TypeScript compile gate 説明 |

## Fit 評価

総合fit: 4.6 / 5.0（約92%）

理由: `npm run typecheck` は source gate と実 `tsc` compilation を通す状態になった。Vite production build、実 AWS 接続、OpenAPI/DB codegen は今回の範囲外として明記しており、依存 audit の脆弱性は自動修正していないため満点ではない。

## 未対応・制約・リスク

- `npm audit` は 22 件の脆弱性を報告した。依存更新や breaking change を伴う可能性があるため、今回は `npm audit fix` を実行していない。
- `tsc` は no-emit compile gate であり、`.ts` source から runtime bundle を生成する検証ではない。
- Vite production build、assistant-ui streaming の実ブラウザ挙動、実 AWS / AgentCore / DSQL / Bedrock 接続は未実施。
