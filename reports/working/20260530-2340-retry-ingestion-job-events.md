# 作業完了レポート

保存先: `reports/working/20260530-2340-retry-ingestion-job-events.md`

## 1. 受けた指示

- 主な依頼: `.workspace/plam-20260530-01.txt` に対応し、atomic persistence / event coverage の planned marker を実装または正当な扱いへ減らす。
- 今回のタスク: `retryIngestionJob` の DSQL query plan に domain event / audit append を追加し、coverage manifest を実装状態に合わせる。
- 条件: Worktree Task PR Flow、task md、commit / PR コメント、検証、作業レポートを実施する。

## 2. 要件整理

| 要件ID | 指示・要件 | 重要度 | 対応状況 |
|---|---|---:|---|
| R1 | `retryIngestionJob` が `ingestion_job_events` に domain event を append する | 高 | 対応 |
| R2 | `retryIngestionJob` が `audit_events` に `document.ingestion.retried` を append する | 高 | 対応 |
| R3 | admin actor / tenant / failed job 境界を弱めない | 高 | 対応 |
| R4 | response shape `{ job }` を維持する | 高 | 対応 |
| R5 | coverage planned marker を外す | 高 | 対応 |

## 3. 検討・判断したこと

- 既存 mapping は failed job を queued に戻す projection update まで実装済みだったため、その更新結果を `retried_job` CTE として event append の入力にした。
- `ingestion_job_events` の `event_seq` は対象 job の最大 sequence + 1 として継続するようにした。
- audit event は local store と同じ `document.ingestion.retried` / `admin_operation` / job id resource / document/version payload に合わせた。
- API shape、route、permission、OpenAPI schema は変更していないため、durable docs の更新は不要と判断した。

## 4. 実施した作業

- `apps/api/src/repositories/dsql/apiRepository.ts` の `retryIngestionJob` query plan を CTE 化した。
- retry 更新後に `ingestion_job_events` と `audit_events` を append する処理を追加した。
- `packages/api-contract/src/implementation-coverage.ts` で `retryIngestionJob` の `domainEvent` / `audit` を `implemented` に更新した。
- `npm run implementation-coverage:generate` で generated mirror を再生成した。

## 5. 成果物

| 成果物 | 形式 | 内容 | 指示との対応 |
|---|---|---|---|
| `apps/api/src/repositories/dsql/apiRepository.ts` | TypeScript | retry ingestion の domain/audit append 追加 | R1-R4 |
| `packages/api-contract/src/implementation-coverage.ts` | TypeScript | coverage manifest 更新 | R5 |
| `packages/api-contract/src/implementation-coverage.js` | JavaScript | generated mirror 更新 | R5 |
| `tasks/do/20260530-2340-retry-ingestion-job-events.md` | Markdown | task tracking と受け入れ条件 | workflow |
| `reports/working/20260530-2340-retry-ingestion-job-events.md` | Markdown | 作業完了レポート | workflow |

## 6. 指示へのfit評価

総合fit: 4.8 / 5.0（約96%）

理由: 今回 slice の実装、coverage 更新、検証は完了した。完全な projector 化ではなく、既存 projection update に event append を追加する段階である点をリスクとして明記した。

## 7. 実行した検証

- `npm run implementation-coverage:generate`: pass
- `npm run implementation-coverage:check`: pass
- `npm run api:implementation:check`: pass（40 operations, 8 planned markers）
- `npm run api:implementation:check:production`: expected fail。残 planned marker は `submitQuestion`, `startUserImport`, `createDocument`, `createDocumentVersion`, `activateDocumentVersion`, `updateDocumentAcl`, `suspendDocument`, `startEvaluationRun`
- `npm run test:integration:local`: pass
- `npm run web:flow:check`: pass
- `npm run typecheck:source`: pass
- `npm run check:static`: pass
- `git diff --check`: pass

## 8. 未対応・制約・リスク

- `submitQuestion` など残り 8 件の API planned marker はこの slice では未対応。
- Tools coverage の planned marker はこの slice では未対応。
- `api:implementation:check:production` は全体ゴール未達のため expected fail のまま。
- 完全な projector 化ではなく、既存 projection update に domain event append を追加する scope に限定した。
