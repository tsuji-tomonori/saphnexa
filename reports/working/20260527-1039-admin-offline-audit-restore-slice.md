# admin/offline/audit/restore ローカル検収スライス 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/local.md` の方針に沿って、検収受入条件 package v1.0 の充足へ向けて実装・検証を継続する。
- リポジトリルールに従い、task md、検証、PR コメント、作業レポートを残す。
- 実施していない AWS/S3/CloudFront/DSQL/復旧試験を実施済みとして扱わない。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | user import、文書登録、版管理、評価実行をローカルで検査する | 対応 |
| R2 | admin event と audit event の網羅性を検査する | 対応 |
| R3 | offline artifact inventory と restore drill report を生成・検査する | 対応 |
| R4 | package scripts、Taskfile、CI、admin report、docs、trace を同期する | 対応 |
| R5 | AWS 実環境が必要な検証を過大に完了扱いしない | 対応 |

## 検討・判断の要約

- AWS 実環境が必要な受入条件は実施済みにせず、ローカル検収で確認できる範囲を `local_verified` として trace に反映した。
- store に `audit_events` を追加し、DB schema/migration の required table にも入れることで、監査を単なる fixture ではなく構造検査の対象にした。
- offline artifact と restore drill は `dist/` 配下へ再生成可能な manifest/report として出力し、チェックコマンドで schema、checksum、必要カテゴリを検査する形にした。

## 実施作業

- `packages/domain/src/store.js` に user import 行処理、admin event helper、audit event helper、artifact access cookie 監査、Tools invocation 監査を追加。
- `audit_events` table を DB schema catalog と Flyway SQL に追加。
- `tools/check-admin-workflows.js`、`tools/check-offline-artifacts.js`、`tools/check-restore-drill.js` を追加。
- `package.json`、`Taskfile.yml`、`.github/workflows/ci.yml`、admin test report、CI/docs check を新規検証コマンドに同期。
- `docs/ops/local-verification.md` と `docs/acceptance/traceability.md` を更新。
- `tasks/do/20260527-1039-admin-offline-audit-restore-slice.md` を作成し、受け入れ条件と検証結果を記録。

## 成果物

| 成果物 | 内容 |
|---|---|
| `tools/check-admin-workflows.js` | user import、文書、評価、admin event、audit event のローカル検査 |
| `tools/check-offline-artifacts.js` | offline artifact inventory の生成・検査 |
| `tools/check-restore-drill.js` | restore drill report の生成・検査 |
| `docs/acceptance/traceability.md` | AC-016/017/018/019/063/100/102/114/120/144 の根拠更新 |
| `docs/ops/local-verification.md` | 新規ローカル検証コマンドと制約追記 |

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

## Fit 評価

総合fit: 4.6 / 5.0（約92%）

主要なローカル検収根拠は追加できた。AWS/S3/CloudFront/DSQL、実 PDF/KB/S3 Vectors、実 backup/restore はこの環境では未実施のため満点ではない。

## 未対応・制約・リスク

- 実 S3 report、S3 inventory、CloudFront 公開、AWS 評価 report、DSQL/Flyway 実適用、実 backup/restore は未検証。
- restore drill は local in-memory state の snapshot 再構成であり、本番 DR の代替ではない。
- PR #1 の最新 GitHub Actions は確認済みで、14 jobs が pass。
