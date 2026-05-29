# 作業完了レポート

保存先: `reports/working/20260529-1241-api-dsql-query-planning-boundary.md`

## 1. 受けた指示

- 主な依頼: `.workspace` の基本設計と `plan-20260529.txt` に基づき、TypeScript / framework / atomicity / generated 型の不足を継続的に前進させる。
- 追加指示: main を pull/fetch してから作業する。
- 今回の対象: Hono API の DSQL repository を、unbound 501 だけの境界から operation-level SQL plan と executor interface を持つ境界へ進める。

## 2. 要件整理

| 要件ID | 指示・要件 | 重要度 | 対応状況 |
|---|---|---:|---|
| R1 | 作業前に `origin/main` を取得し、worktree状態を確認する | 高 | 対応 |
| R2 | `DsqlQueryExecutor` を SQL text / params の executor interface として定義する | 高 | 対応 |
| R3 | `createDsqlApiRepository` で mapped operation を SQL plan 経由で実行する | 高 | 対応 |
| R4 | read系代表 operation の SQL plan に migration table 名と認可境界を含める | 高 | 対応 |
| R5 | executor 未設定と operation 未対応を別 error code にする | 高 | 対応 |
| R6 | dsql mode dispatch service が DSQL repository factory を使う | 高 | 対応 |
| R7 | 実 Aurora DSQL 接続を完了扱いしない | 高 | 対応 |

## 3. 検討・判断したこと

- 現状の `DsqlApiRepository` は interface と unbound response のみで、実接続に向けた operation 別 SQL 境界がなかった。
- いきなり Aurora DSQL driver / IAM auth / connection pool を入れるより、まず Hono operation と DSQL table の対応を source-level で固定する方針にした。
- `getMe` の CSRF token は DB の secret hash をレスポンスへ返すべきではないため、CSRF token issuer を別境界として未設定時は明示エラーにした。
- UI/API response の fake data は生成せず、executor が返した rows だけを response body に写像する方針にした。

## 4. 実施した作業

- `apps/api/src/repositories/dsql/apiRepository.ts` に `DsqlQuery` / `DsqlQueryExecutor` / `DsqlCsrfTokenIssuer` を追加した。
- `createDsqlApiRepository` を追加し、mapped operation を SQL plan と executor で実行するようにした。
- `getMe`、`listChatSessions`、`listMessageEvents`、`listPublishedArtifacts` の SQL plan を追加した。
- executor 未設定時は `DSQL_EXECUTOR_NOT_BOUND`、operation 未対応時は `DSQL_OPERATION_NOT_MAPPED`、CSRF issuer 未設定時は `DSQL_CSRF_ISSUER_NOT_BOUND` を返すようにした。
- `apps/api/src/services/apiDispatchService.ts` の dsql mode で `createDsqlApiRepository` を使うようにした。
- `tools/check-type-surface.js` に DSQL query planning source gate を追加した。
- `docs/ops/local-verification.md` に検証範囲と未検証範囲を追記した。

## 5. 成果物

| 成果物 | 形式 | 内容 | 指示との対応 |
|---|---|---|---|
| `apps/api/src/repositories/dsql/apiRepository.ts` | TypeScript | DSQL executor interface と read系 SQL plan | R2/R3/R4/R5 |
| `apps/api/src/services/apiDispatchService.ts` | TypeScript | dsql mode の repository factory 接続 | R6 |
| `tools/check-type-surface.js` | JS | DSQL repository source gate | R6 |
| `docs/ops/local-verification.md` | Markdown | DSQL boundary の検証範囲と未検証範囲 | R7 |

## 6. 指示へのfit評価

| 評価軸 | 評価 | 理由 |
|---|---:|---|
| 指示網羅性 | 4 | DSQL repository 境界は前進したが、実 Aurora DSQL 接続は未実施 |
| 制約遵守 | 5 | main fetch、task md、report、未実施検証の明記を実施 |
| 成果物品質 | 4 | source gate と typecheck で検査可能。write mapping / driver は別途必要 |
| 説明責任 | 5 | 初回 typecheck 失敗と修正、未対応範囲を記録 |
| 検収容易性 | 5 | 変更ファイルと検証コマンドを明示 |

総合fit: 4.5 / 5.0（約90%）

理由: Hono API の DSQL repository は operation-level SQL plan まで進んだが、実 Aurora DSQL driver / IAM auth / connection pool は未実装のため満点ではない。

## 7. 検証

- `npm run typecheck -w @saphnexa/api`: 初回 fail。`exactOptionalPropertyTypes` により undefined optional property を渡していたため、未設定 property を渡さない形に修正。追加で `notFoundErrorCode` の union narrowing を明示型で修正後 pass。
- `git diff --check`: pass。
- `npm run docs:check`: pass。
- `npm run typecheck`: pass。

## 8. 未対応・制約・リスク

- 実 Aurora DSQL driver / IAM auth token / connection pool / transaction 管理は未実施。
- write operation の SQL mapping は未実施。
- `getMe` の real CSRF token issuer は未接続。
- DSQL SQL の実行計画・インデックス・性能は未検証。
