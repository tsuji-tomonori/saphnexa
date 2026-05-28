# TypeScript framework implementation 作業レポート

## 指示

- `.workspace` の `Saphnexa_基本設計書_v0.17_package.zip` と `plan-20260529.txt` を根拠に、API / Agent / Web / UI を TypeScript framework 実装へ進める。
- main を pull してから作業する。
- repository local workflow に従い、task、検証、PR、作業レポートを残す。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | `origin/main` 最新を取り込んだ専用 worktree で作業する | 対応 |
| R2 | API / Tools API / Agent に TypeScript entry を追加する | 対応 |
| R3 | Web を React + Vite + TypeScript / TanStack Query / assistant-ui adapter 境界へ寄せる | 対応 |
| R4 | UI package を Atomic Design 階層へ分割する | 対応 |
| R5 | 本番 UI に固定 mock / demo fallback を入れない | 対応 |
| R6 | 実 AWS 接続や未実施検証を完了扱いにしない | 対応 |

## 検討・判断

- main には Hono/Zod/OpenAPI の JS 実装が入っていたため、それを壊さず TypeScript entry と package scripts を追加した。
- `git stash` が出力なしで失敗したため、一時 commit で作業差分を保護してから `git pull --rebase origin main` を実行した。競合は `apps/api/package.json` のみで、main 側の OpenAPI script と依存 version を優先しつつ TS export/typecheck を残した。
- Web は旧 `ChatApp` / `AdminApp` 直書き構造から、page / feature / hook へ分割した。管理評価 dataset id は固定値にせず、入力値から送る形にした。
- static validation は旧単一コンポーネント前提だったため、分割後の責務を検査するよう更新した。

## 実施作業

- `tsconfig` と workspace package scripts を追加。
- `apps/api`、`apps/tools-api`、`apps/agent` に TypeScript entry を追加。
- `packages/ui` を atoms / molecules / organisms / templates に分割。
- `apps/web` に TanStack Query hooks、assistant-ui adapter boundary、Chat/Admin page/feature components を追加。
- `docs/ops/local-verification.md` に TypeScript framework 境界と未完了扱いの注意を追記。
- `tools/check-*` の local source gate を分割後の構造に更新。

## 成果物

| 成果物 | 内容 |
|---|---|
| `apps/api/src/app.ts` | Hono + Zod OpenAPI TypeScript app entry |
| `apps/tools-api/src/app.ts` | Tools API TypeScript app entry |
| `apps/agent/src/app.ts` | AgentCore Runtime 互換 `/ping` / `/invocations` entry |
| `apps/web/src/pages/*` | Chat/Admin page structure |
| `apps/web/src/features/*` | Chat/Admin feature components |
| `apps/web/src/hooks/*` | TanStack Query hook boundary |
| `packages/ui/src/*` | Atomic Design UI components |
| `docs/ops/local-verification.md` | local verification doc update |

## 実行した検証

- `npm run typecheck`: pass
- `npm run test:contract`: pass
- `npm run api:openapi:check`: pass
- `npm run ui:check`: fail -> static check の新構造条件を修正後 pass
- `npm run web:flow:check`: fail -> hook 分割後の source gate を修正後 pass
- `npm run web:a11y:check`: pass
- `npm run scan:bundle-domains`: pass
- `npm run test:integration:local`: pass
- `npm run docs:check`: pass
- `npm test`: pass
- `git diff --check`: pass

## 未対応・制約・リスク

- `tsc` 実体はこの環境に未導入のため、今回の `npm run typecheck` は repository の type surface source gate。package scripts と tsconfig は追加済みだが、依存 install 後の `tsc --build` は未実施。
- 実 AWS DSQL / Bedrock / Cognito / AppSync Events / AgentCore Runtime 接続、Vite production build、実ブラウザ streaming 動作は範囲外。
- GitHub PR 作成後に受け入れ条件コメントとセルフレビューコメントを追加し、その後 task を done に移す必要がある。

## Fit 評価

総合fit: 4.4 / 5.0（約88%）

理由: plan の主要な framework 化スライス、main pull、local source gate、docs 更新は満たした。一方で、依存 install 後の実 `tsc` / Vite build と実 AWS runtime 接続は範囲外として残るため満点ではない。
