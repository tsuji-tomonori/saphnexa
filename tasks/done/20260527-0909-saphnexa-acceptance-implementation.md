# Saphnexa 検収実装タスク

## 背景

- ユーザーから `.workspace/Saphnexa_基本設計書_v0.16.md` をもとに実装し、`.workspace/local.md` を参考にローカル確認し、`.workspace/Saphnexa_検収受入条件_package_v1.0` を満たすまで作業継続する依頼を受けている。
- 検収パッケージは P0/P1/P2 全項目 PASS、証跡マニフェスト、CI/CD、AWS dev/UAT 相当の監査証跡まで要求しているため、今回の task は完了ゴールではなく、検収達成へ向けた最初の実装基盤とローカル検証可能な縦断スライスを作る。

## 目的

- 基本設計 v0.16 に沿ったモノレポ構成、契約、DB migration、API/Tools/RAG/認可/UI の初期実装を作る。
- ローカルで検証できる範囲を `.workspace/local.md` の境界に合わせ、AWS 実体が必要な項目は未検証として明確に残す。
- 検収条件と実装/テスト/証跡の対応を追跡できる形にする。

## スコープ

- npm workspaces ベースの初期モノレポ。
- API contract / Tools contract / domain constants / DB migration / local in-memory service。
- chat, participant, question, event, favorite, admin artifact, document, evaluation, user import の初期 API 挙動。
- Tools API と fixture RAG adapter の初期実装。
- React UI 方針に沿った画面ソースと、ローカル検証用の静的/契約テスト。
- acceptance trace と実装差分 ADR。

## スコープ外

- AWS アカウント上の実デプロイ、CloudFormation 実 outputs、DSQL 実接続、Bedrock KB / S3 Vectors / AgentCore / Cognito / AppSync Events の実サービス検証。
- Git tag / GitHub release / Allure 公開 URL など、外部状態を伴う最終検収証跡の確定。

## タスク種別

機能追加

## チェックリスト

- [x] 基本設計と検収パッケージから初期実装で扱う境界を抽出する。
- [x] モノレポ、scripts、Taskfile、CI 相当のローカル検証コマンドを追加する。
- [x] API/Tools 契約と共通エラー schema を実装する。
- [x] DB migration と整合性検査を実装する。
- [x] chat/participant/question/event/favorite/admin/document/evaluation のローカル挙動を実装する。
- [x] RAG fixture、Tools invocation 監査、ACL 再確認、citation 整形を実装する。
- [x] UI の主要画面ソースと相対パス API 呼び出しを実装する。
- [x] acceptance trace / ADR / runbook の最低限の durable docs を作成する。
- [x] 選定した検証を実行し、失敗した場合は修正して再実行する。
- [x] 作業完了レポートを `reports/working/` に保存する。

## Done 条件

- Deliverables:
  - 実装基盤と初期縦断スライスのソースが worktree に存在する。
  - 検収 AC と実装/検証/未検証理由の対応表が存在する。
  - 基本設計との差分 ADR が存在し、未承認差分を隠していない。
  - 作業レポートが存在する。
- Validations:
  - `git diff --check` が pass する。
  - package scripts で contract / unit / integration 相当のローカル検証が pass する。
  - React bundle 相当の静的 scan で `execute-api`, `appsync-api`, `appsync-realtime-api` が出ないことを確認する。
  - AWS 実体が必要な AC は PASS とせず、未検証・外部依存として trace に残す。

## 受け入れ条件

- [ ] `apps/`, `packages/`, `infra/`, `docs/`, `tests/` の初期構成が基本設計のモノレポ方針と対応している。
- [ ] 公開 API 38 件と Tools API 6 件の契約メタデータが定義され、契約検査で件数と共通エラー形式を確認できる。
- [ ] chat は user 配下ではなく独立リソースで、参加者 owner/viewer による参照/更新/質問送信の認可差がテストで確認できる。
- [ ] 質問送信は `message_id` / `run_id` を即時生成し、軽量 event payload、REST event detail、citation 参照、refusal を fixture RAG で検証できる。
- [ ] 管理者向けユーザー取込、文書登録/版管理、評価 run、成果物閲覧の API/UI source が存在し、管理者/一般ユーザーの認可差がテストで確認できる。
- [ ] DB migration に主要テーブル、append-only event、model catalog、BM25F/reference/evaluation/artifact 系テーブルが含まれる。
- [ ] acceptance trace で AC ごとに `implemented`, `local_verified`, `requires_aws`, `not_started` などの状態と根拠ファイルが分かる。
- [ ] 実施した検証と未実施検証の理由が task/report に記録されている。

## 検証計画

- `npm test`
- `npm run test:contract`
- `npm run test:integration:local`
- `npm run scan:bundle-domains`
- `git diff --check`

## 検証結果

- `npm test`: pass
- `npm run verify`: pass
- `npm run test:contract`: pass
- `npm run test:integration:local`: pass
- `npm run scan:bundle-domains`: pass
- `git diff --check`: pass
- 補足: 並列実行した個別 npm script 2 本が一度 proto の offline version 解決で fail したが、同一コマンドを順次再実行して pass。実装不具合ではなくローカル Node shim の並列解決に起因する一時失敗と判断。

## ドキュメント保守方針

- 実装挙動と検収追跡は `docs/` に最小限追加する。
- 一時的な作業経緯は `reports/working/` に残し、durable docs へは混ぜない。
- AWS 実体未検証の項目は実施済みとして記載しない。

## PR レビュー観点

- 設計書 v0.16 の API 件数、Tools 件数、DB 主要テーブル、認可境界と矛盾していないこと。
- 本番経路に架空業務データの fallback を入れていないこと。
- RAG の根拠性、ACL 再確認、retrieval policy 緩和禁止を弱めていないこと。
- benchmark/golden 固有値を本番ロジックへ混入させていないこと。

## リスク

- 全 AC の最終 PASS には AWS dev/UAT 環境、GitHub Actions、S3/CloudFront/DSQL/Bedrock/AppSync/AgentCore の実証跡が必要であり、このローカル実装だけでは完了しない。
- 依存関係のインストールが必要な場合、ネットワーク制約で検証が blocked になる可能性がある。

## 状態

done

## PR

- Pull Request: https://github.com/tsuji-tomonori/saphnexa/pull/1
- 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550191389
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550194332
- GitHub Apps での PR 作成・コメントは `Resource not accessible by integration` のため失敗し、`gh` にフォールバックした。
