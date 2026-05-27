# DB・検索・監視ローカル検収スライス

## 背景

- 検収 trace では AC-070/071/072/074/075/076/112/113/142 が scaffolded または implemented_unverified のまま残っている。
- `.workspace/local.md` の方針では、DSQL/Flyway/CloudWatch 実体は AWS dev/UAT で薄く検証し、ローカルでは契約・SQL・invariant・catalog を検査する。

## 目的

- DB migration、主要ドメイン整合性、append-only、参照グラフ、BM25F、監視メトリクス/アラーム/保持期間をローカル・CI で検査可能にする。
- DSQL/Flyway 実適用、CloudWatch 実メトリクス/アラーム/S3 lifecycle は未実施として明確に残す。

## スコープ

- Flyway versioned SQL migration の命名、checksum、schema_migrations、required tables、自動 migration 不採用の静的検査。
- local store に対する主要ドメイン整合性と event seq append-only 検査。
- reference graph sample 10/10 と BM25F golden recall@10 >=0.80 の local fixture 検査。
- required metrics 7/7、alarms 6/6、retention policy の local catalog と検査。
- npm scripts、Taskfile、CI workflow、admin report suite、trace、作業レポート更新。

## スコープ外

- Aurora DSQL への Flyway 実適用。
- DSQL query による integrity check report。
- CloudWatch metrics/dashboard/alarms の実リソース確認。
- S3 lifecycle / DSQL settings の実リソース確認。

## タスク種別

機能追加

## チェックリスト

- [x] migration 静的検査を追加する。
- [x] DB integrity / append-only local 検査を追加する。
- [x] reference graph / BM25F local fixture と検査を追加する。
- [x] observability metrics / alarms / retention catalog と検査を追加する。
- [x] npm scripts、Taskfile、CI workflow、admin report suite、trace/docs を更新する。
- [x] 検証を実行し、作業レポートを作成する。
- [x] commit/push/PR コメント/セルフレビュー/task done 更新まで完了する。

## Done 条件

- Deliverables:
  - migration、DB integrity、BM25F/reference、observability catalog の検査 script がある。
  - local fixture と catalog が source 管理されている。
  - `npm run verify` と CI に追加ゲートが組み込まれている。
  - acceptance trace と作業レポートが更新されている。
- Validations:
  - `npm run db:migration:check` pass
  - `npm run db:integrity:check` pass
  - `npm run search:local:check` pass
  - `npm run observability:check` pass
  - `npm test` pass
  - `npm run verify` pass
  - `git diff --check` pass
  - `pre-commit run --files <changed-files>` pass

## 受け入れ条件

- [x] migration checker は Flyway naming、schema_migrations、checksum、required tables、ORM auto migration 不採用を検査する。
- [x] DB integrity checker は tenant/user/chat/participant/message/run/document/version/ingestion/evaluation/artifact の主要 invariant violation 0件を検査する。
- [x] append-only checker は既存 event payload/status 更新なし、event_seq 重複 0件を検査する。
- [x] reference graph checker は sample 10/10 展開成功を検査する。
- [x] BM25F checker は golden query recall@10 >=0.80 を検査する。
- [x] observability checker は required metrics 7/7、alarms 6/6、retention 未設定 0件を検査する。
- [x] DSQL/Flyway/CloudWatch/S3 lifecycle 実リソース確認は未実施として trace/report に明記する。

## 検証計画

- `npm run db:migration:check`
- `npm run db:integrity:check`
- `npm run search:local:check`
- `npm run observability:check`
- `npm test`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- `npm run db:migration:check`: pass
- `npm run db:integrity:check`: pass
- `npm run search:local:check`: pass
- `npm run observability:check`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `npm run acceptance:check`: pass
- `npm run admin-artifacts:build`: pass
- `npm run artifacts:check`: pass
- `npm test`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files <changed-files>`: pass

## ドキュメント保守方針

- `docs/acceptance/traceability.md` は local static/fixture と AWS/DSQL/CloudWatch 実体未実施を分けて記載する。
- `docs/ops/local-verification.md` に追加コマンドを反映する。

## PR レビュー観点

- static catalog を実リソース確認の完了として過大表現していないこと。
- DB invariant が fixture 固有の成功だけでなく、主要関係の破綻を検出すること。
- BM25F/reference fixture を本番 fallback として扱っていないこと。

## リスク

- local static/fixture gate は Aurora DSQL/Flyway/CloudWatch/S3 の実リソース証跡ではないため、最終検収には AWS dev/UAT の証跡が必要。

## 状態

done

## PR

- Pull Request: https://github.com/tsuji-tomonori/saphnexa/pull/1
- 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550474671
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550475448
- GitHub Apps は既知の `Resource not accessible by integration` のため、`gh` fallback で PR コメントを投稿した。
