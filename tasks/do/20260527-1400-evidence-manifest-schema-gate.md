# evidence manifest schema gate

- 状態: doing
- タスク種別: 機能追加
- 作成日時: 2026-05-27 14:00 JST
- 対象 PR: #1

## 背景

AC-001/AC-002 は最終 `evidence_manifest.json` を提出して Git tag/release、AWS account、CloudFormation stack、Allure/docs URL、RAG 評価、cost estimate を照合することを要求している。現状の `docs/acceptance/evidence/evidence_manifest.schema.json` は `.workspace` の schema と概ね同じだが、source checksum と nested property の同期検査が弱い。

## 目的

`.workspace/Saphnexa_検収受入条件_package_v1.0/Saphnexa_証跡マニフェスト_schema_v1.0.json` 由来の schema snapshot をリポジトリ内で明示し、example と draft/final validator が schema から逸脱しないことを機械検査する。

## スコープ

- evidence manifest schema を `.workspace` schema と同期する。
- schema source metadata/checksum を追加する。
- `npm run evidence:check` を強化し、nested required/properties、example の draft-only 性、final placeholder 禁止条件との整合を検査する。
- docs/CI/admin report は既存 `evidence:check` に統合済みのため、必要があれば追記に留める。
- 実 Git tag/release、AWS deploy/publish、final evidence 作成は実行しない。

## 実装チェックリスト

- [x] evidence manifest schema を source schema に同期し source checksum を記録する。
- [x] `tools/check-evidence-manifest.js` の検査を強化する。
- [x] final evidence candidate validator と draft package check との整合を確認する。
- [x] 対象検証と `npm run verify` を通す。
- [ ] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## Done 条件

- `npm run evidence:check` が schema source checksum、required fields、nested properties、example draft-only marker を検査して pass する。
- `npm run acceptance:final-candidate:check` が final candidate 未配置を `not_ready` として扱い、placeholder final を許可しない。
- `npm run acceptance:package:check` と `npm run verify` が pass する。
- `git diff --check`、pre-commit が pass する。

## 受け入れ条件

- AC-001: `evidence_manifest.json` の Git commit/tag/AWS account/release 証跡 schema が source schema と同期している。
- AC-002: test reports/docs/RAG/cost の提出 field が schema と checker で欠落なく検査される。
- AC-004/150/151/152: example は draft-only として扱われ、final PASS の根拠に使えないことが検査される。

## 検証計画

- `npm run evidence:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:final:build`
- `npm run acceptance:final:check`
- `npm run acceptance:package:build`
- `npm run acceptance:package:check`
- `npm run docs:check`
- `npm run ci:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## リスク・制約

- schema gate は最終 evidence manifest の形を検査するものであり、実 release/AWS/publish/signoff を代替しない。
- `.workspace` の schema が更新された場合、schema snapshot と checksum の再同期が必要。
