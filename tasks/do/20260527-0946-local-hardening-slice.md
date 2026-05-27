# ローカルセキュリティ・品質 hardening スライス

## 背景

- 現在の PR #1 では API/Tools 契約、ローカル縦断スライス、CI/証跡/運用検査の土台がある。
- 検収 trace では、CSRF runtime、WebSocket ticket negative、prompt injection、取り込み冪等/失敗、pairwise、性能、費用、storage/metadata の一部が未実装または scaffolded のまま残っている。

## 目的

- ローカルで検証可能なセキュリティ・品質 hardening を追加し、検収 package の未達 AC をさらに減らす。
- AWS 実体が必要な最終証跡は未実施として残しつつ、アプリケーション境界で検証可能な invariant をコードと test に落とす。

## スコープ

- local API の CSRF runtime guard。
- local WebSocket ticket の発行、再利用拒否、他ユーザー拒否、期限切れ拒否。
- fixture RAG の prompt injection refusal。
- document ingestion の metadata 必須検査、冪等再実行、失敗状態、retry。
- pairwise case catalog と検査。
- local performance smoke と cost estimate の検査。
- storage prefix / metadata / OpenSearch 非依存の静的検査。
- acceptance trace、tests、scripts、report 更新。

## スコープ外

- 実 Cognito session、CloudFront/AppSync WebSocket、DSQL/Flyway 実 DB、S3 inventory、Bedrock KB/S3 Vectors/AgentCore の実証跡。
- Lighthouse/Playwright/axe の本格導入。
- AWS Pricing Calculator や Cost Explorer からの実見積。

## タスク種別

機能追加

## チェックリスト

- [x] CSRF runtime guard と negative test を追加する。
- [x] ws-ticket の期限切れ/再利用/他ユーザー利用拒否を実装・検証する。
- [x] prompt injection 入力を拒否し、policy violation が起きないことを検証する。
- [x] document ingestion の metadata 必須検査、冪等性、失敗/再実行可能状態を実装・検証する。
- [x] pairwise 15 ケース catalog と実行率検査を追加する。
- [x] local performance smoke と cost estimate 検査を追加する。
- [x] storage prefix / metadata / OpenSearch 非依存検査を追加する。
- [x] acceptance trace と作業レポートを更新する。
- [x] 検証を実行し、commit/push/PR コメントまで反映する。

## Done 条件

- Deliverables:
  - CSRF/ws-ticket/prompt injection/ingestion hardening の source と tests がある。
  - pairwise/cost/performance/storage metadata の検査 scripts がある。
  - acceptance trace が更新されている。
  - 作業レポートがある。
- Validations:
  - `npm test` pass
  - `npm run verify` pass
  - `npm run security:scan` pass
  - `npm run pairwise:check` pass
  - `npm run perf:local` pass
  - `npm run cost:check` pass
  - `npm run storage:check` pass
  - `git diff --check` pass
  - `pre-commit run --files <changed-files>` pass

## 受け入れ条件

- [ ] 状態変更 API は CSRF token 欠落/不一致で 403 になる。
- [ ] ws-ticket は短期有効で、期限切れ/再利用/他ユーザー利用が拒否される。
- [ ] prompt injection 風入力で system/tool 制約を破る回答を返さず refusal になる。
- [ ] 同一文書版の取り込み再実行で重複 document_version / ingestion job が増えない。
- [ ] 不正 metadata の取り込みは failed 状態、error event、retry 可能状態になる。
- [ ] pairwise 15 ケースが catalog 化され、実行率 100% として検査される。
- [ ] local performance smoke が質問受付 p95 と event payload size を検査する。
- [ ] cost estimate が 550 USD 以下で検査され、OpenSearch 非依存が静的検査される。

## 検証計画

- `npm test`
- `npm run verify`
- `npm run pairwise:check`
- `npm run perf:local`
- `npm run cost:check`
- `npm run storage:check`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- `npm test`: pass
- `npm run verify`: pass
- `npm run pairwise:check`: pass
- `npm run perf:local`: pass
- `npm run cost:check`: pass
- `npm run storage:check`: 初回は traceability の説明文 `OpenSearch` を依存導入と誤検出して fail。検査対象を code/infra/package に限定後 pass。
- `git diff --check`: pass

## ドキュメント保守方針

- 恒久的な検収状態は `docs/acceptance/traceability.md` に反映する。
- 作業の制約と fit は `reports/working/` に残す。
- AWS 実証跡未実施の項目は PASS と書かない。

## PR レビュー観点

- CSRF や ws-ticket の negative test が bypass になっていないこと。
- prompt injection 対策が benchmark 固有値や期待文言 hard-code ではなく、入力分類と refusal に閉じていること。
- ingestion fixture が本番 fallback の架空データとして UI/API に漏れないこと。

## リスク

- local fixture で検証した invariant は AWS 実体の挙動を証明しないため、CloudFront/AppSync/Cognito/DSQL/S3/Bedrock smoke は後続で必要。

## 状態

in_progress
