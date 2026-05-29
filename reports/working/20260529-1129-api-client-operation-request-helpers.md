# 作業完了レポート

保存先: `reports/working/20260529-1129-api-client-operation-request-helpers.md`

## 1. 受けた指示

- 主な依頼: `.workspace` の基本設計と `plan-20260529.txt` に基づき、Saphnexa の TypeScript / framework 実装を継続する。
- 追加指示: `main` を pull/fetch してから作業する。
- 今回の対象: generated operation 型を実際の Web API request helper に接続し、frontend/backend 共有型の実利用を進める。

## 2. 要件整理

| 要件ID | 指示・要件 | 重要度 | 対応状況 |
|---|---|---:|---|
| R1 | `origin/main` を取得し、main 側未取り込みがない状態で作業する | 高 | 対応 |
| R2 | API client が generated operation 型に基づく request helper を持つ | 高 | 対応 |
| R3 | helper が HTTP method と operationId の不一致を型で拒否する | 高 | 対応 |
| R4 | Web の主要 API 呼び出しが手書き response generic から operation-aware helper へ移行する | 高 | 対応 |
| R5 | source gate と Web flow gate が移行を確認する | 高 | 対応 |
| R6 | 実 HTTP / runtime validation / 全画面完全型付けを完了扱いにしない | 高 | 対応 |

## 3. 検討・判断したこと

- 生成済み operation 型を export するだけでは frontend/backend 共有型の実利用として弱いため、`apiGetOperation` / `apiPostOperation` などの operation-aware helper を追加した。
- 既存の低レベル `apiGet` / `apiPost` は互換のため残し、Web の主要経路だけを generated operation response 型へ移行した。
- `issueWsTicket` の返却型は generated 型により `{ ticket: string }` と分かったため、Web 側の古い nested ticket 期待を修正した。
- `evaluation_run` の nested object はまだ詳細型未生成のため、UI 側で `statusFromEvaluationRun` による runtime shape 確認を入れた。

## 4. 実施した作業

- `packages/api-client/src/client.ts` に `ApiClientOperationIdForMethod`、`ApiClientRequestBodyInput`、`apiGetOperation`、`apiPostOperation`、`apiPatchOperation`、`apiDeleteOperation` を追加した。
- Web hooks/pages/runtime の主要 API 呼び出しを `apiGetOperation` / `apiPostOperation` に移行した。
- `apps/web/src/pages/ChatPage.tsx` の WebSocket ticket 取り扱いを generated response 型に合わせた。
- `apps/web/src/features/admin/AdminActions.tsx` に nested response の status guard を追加した。
- `tools/check-type-surface.js` と `tools/check-web-flows.js` を operation-aware helper 境界に更新した。
- `docs/ops/local-verification.md` に operation-aware Web request helper の確認範囲を追記した。

## 5. 成果物

| 成果物 | 形式 | 内容 | 指示との対応 |
|---|---|---|---|
| `packages/api-client/src/client.ts` | TypeScript | operation-aware request helpers | generated 型の実利用 |
| `apps/web/src/**/*.ts(x)` | TypeScript/TSX | Web 主要 API 呼び出しの移行 | frontend/backend 共有型 |
| `tools/check-type-surface.js` | JavaScript | Web の手書き generic 退行検査 | 検証自動化 |
| `tools/check-web-flows.js` | JavaScript | flow gate の helper 境界更新 | Web flow 検証 |
| `docs/ops/local-verification.md` | Markdown | local verification 更新 | docs maintenance |
| `tasks/do/20260529-1129-api-client-operation-request-helpers.md` | Markdown | 受け入れ条件と検証結果 | Worktree Task PR Flow |

## 6. 指示へのfit評価

| 評価軸 | 評価 | 理由 |
|---|---:|---|
| 指示網羅性 | 4 | generated 型の Web 実利用を進めたが、全画面完全型付けは未対応 |
| 制約遵守 | 5 | main fetch、task md、docs/report、検証を実施 |
| 成果物品質 | 4 | operation/method 型制約と Web 移行を追加。nested 詳細型は次段階 |
| 説明責任 | 5 | 未対応範囲を task/report/docs に明記 |
| 検収容易性 | 5 | typecheck/source gate/web flow で確認可能 |

総合fit: 4.5 / 5.0（約90%）
理由: Web の主要 API 呼び出しは generated operation helper に移行したが、nested object 詳細型、実 HTTP、AWS runtime validation は未対応のため満点ではない。

## 7. 実行した検証

- `npm run typecheck:source`: pass。
- `npm run typecheck -w @saphnexa/api-client`: pass。
- `npm run typecheck -w @saphnexa/web`: fail -> `evaluation_run.status` の runtime guard 追加後 pass。
- `npm run typecheck`: pass。
- `npm run build -w @saphnexa/web`: pass。
- `npm run web:flow:check`: fail -> source gate 更新後 pass。
- `npm run test:contract`: pass。
- `npm run docs:check`: pass。
- `npm test`: pass。
- `git diff --check`: pass。

## 8. 未対応・制約・リスク

- Web 全画面・全 operation の完全型付けは未対応。
- 配列要素や nested object の完全 field-level 型生成は未対応。
- 実 CloudFront/Cognito 経由 HTTP request は未検証。
- AWS runtime validation は未対応。
