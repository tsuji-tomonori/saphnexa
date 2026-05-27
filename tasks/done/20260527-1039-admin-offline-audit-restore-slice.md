# admin/offline/audit/restore ローカル検収スライス

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-27 10:39 JST
- 対象 PR: #1

## 背景

`.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/Saphnexa_検収受入条件_package_v1.0` に対する検収実装で、AWS 実環境待ちではない管理系ワークフロー、offline artifact、監査、復旧試験のローカル検証根拠が不足している。

## 目的

ローカル API/store と検査スクリプトで、user import、文書登録・版管理、評価実行、admin event、audit log、offline artifact inventory、restore drill を機械検証できるようにする。

## スコープ

- 管理系ローカル store の操作結果、admin event、audit event を拡張する。
- offline artifact inventory と restore drill のローカル検査スクリプトを追加する。
- package scripts、Taskfile、CI workflow、admin test report、docs、traceability を同期する。
- AWS/S3/CloudFront/DSQL 実公開や実復旧はこのスライスでは行わず、未検証として trace に残す。

## 実装前チェックリスト

- [x] 既存 local API/store と検収 trace の不足を確認する。
- [x] user import 4 ケース、document 5 件、version activation、evaluation metrics を検査する。
- [x] admin event と audit event の必須カテゴリを検査する。
- [x] offline artifact inventory と restore drill report を生成・検査する。
- [x] docs/trace/CI/admin report のコマンド一覧を同期する。
- [x] 関連検証と `npm run verify` を通す。
- [x] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- user import の create/update/delete/invalid row と result prefix/error row report がローカルで検査される。
- document registration 5 件、raw/parsed metadata、version activation、evaluation run metrics がローカルで検査される。
- admin event と audit event が、管理操作・文書公開/成果物・チャット共有・Tools invocation・評価実行を網羅していることを検査できる。
- offline artifact inventory が chunk/reference/BM25F/parser manifest を含み、restore drill report が RTO/RPO/checksum を含む。
- `package.json`、`Taskfile.yml`、`.github/workflows/ci.yml`、`tools/build-admin-test-report.js`、`docs/ops/local-verification.md`、`docs/acceptance/traceability.md` が実装と同期している。
- 対象検証、docs/acceptance 検証、関連 unit test、`npm run verify`、`git diff --check` が pass する。
- 作業レポートを `reports/working/` に保存し、commit/push 後に PR コメントを追加する。

## 受け入れ条件

- AC-016: ローカル user import で create/update/delete/invalid row を処理し、失敗行と結果 prefix を検査できる。
- AC-017: ローカル document registration 5 件で raw URI、parsed prefix、metadata JSON、ingestion job を検査できる。
- AC-018: ローカル document version activation で新 active/旧 archived を検査できる。
- AC-019: ローカル evaluation run で retrieval/generation/end-to-end metrics と artifact prefix を検査できる。
- AC-063: admin event の user_import/ingestion/evaluation/artifact 系カテゴリを検査できる。
- AC-100/AC-102: offline artifact inventory に raw/parsed/chunk/reference/BM25F/parser manifest を含むことを検査できる。
- AC-114: audit event が管理操作、文書公開/成果物、チャット共有、Tools execution、評価を網羅することを検査できる。
- AC-144: ローカル restore drill report の RTO/RPO/checksum を検査できる。

## 検証計画

- `npm run admin:workflow:check`
- `npm run offline-artifacts:check`
- `npm run restore:drill:check`
- `npm test`
- `npm run ci:check`
- `npm run docs:check`
- `npm run acceptance:check`
- `npm run admin-artifacts:build`
- `npm run artifacts:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## ドキュメント保守方針

- local verification docs に新規検証コマンドを追記する。
- traceability はローカル検証の根拠を反映し、AWS 実公開・実復旧が必要な範囲を未検証として明記する。
- README/API examples はユーザー向け操作手順の変更がない限り更新しない。

## PR レビュー観点

- docs と実装の同期。
- 変更範囲に見合うテスト。
- RAG の根拠性・認可境界を弱めていないこと。
- benchmark 期待語句、QA sample 固有値、dataset 固有分岐を本番経路へ入れていないこと。
- 監査・admin event がローカル fixture 専用であることを過大に本番保証として表現していないこと。

## リスク・制約

- AWS/S3/CloudFront/DSQL/Allure publish の実環境検証はこのスライスでは実施しない。
- ローカル restore drill は in-memory store snapshot の再構成検査であり、本番バックアップ/復旧試験の代替ではない。

## 実行した検証

- `npm run admin:workflow:check`: pass
- `npm run offline-artifacts:check`: pass
- `npm run restore:drill:check`: pass
- `npm run test:contract`: pass
- `npm run test:integration:local`: pass
- `npm run db:migration:check`: pass
- `npm run db:integrity:check`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `npm run acceptance:check`: pass
- `npm test`: pass
- `npm run admin-artifacts:build`: pass
- `npm run artifacts:check`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files ...`: pass
- PR #1 GitHub Actions `Saphnexa CI`: pass（14 jobs）

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550541501
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550543438
