# final manifest required value gate

状態: done

## 背景

`.workspace/Saphnexa_検収受入条件_package_v1.0` は、検収対象 commit SHA、CDK stack、DB migration version、Docusaurus 設計書版、Allure report URL などを `evidence_manifest.json` に記録することを完了条件にしている。現状の final evidence candidate validator は主要 URL や Git tag/release の整合性を検査するが、`cdk_app_version`、`db_migration.tool`、`db_migration.latest_version`、`cost_estimate.assumption` は required key の存在確認に寄っており、空文字や draft 値を十分に拒否していない。

## 目的

final evidence candidate の manifest 検査で、必須セクションの重要値が空または draft/pending 値のままでも最終検収 ready にならないようにする。

## タスク種別

修正

## なぜなぜ分析

### 問題文

2026-05-27 時点の final evidence candidate validator で、`cdk_app_version`、`db_migration.tool`、`db_migration.latest_version`、`cost_estimate.assumption` が空または draft 相当でも、他の条件が満たされていれば manifest 検査を通過し得る。

### 確認済み事実

- `tools/final-evidence-candidate.js` は `cdk_app_version` を required key に含めている。
- `tools/final-evidence-candidate.js` は `db_migration.checksum_status === "matched"` を検査している。
- `tools/final-evidence-candidate.js` は `cost_estimate.monthly_usd <= 550` を検査している。
- `tools/final-evidence-candidate.js` は `cdk_app_version` の値、`db_migration.tool/latest_version` の値、`cost_estimate.assumption` の値を final text として検査していない。

### 推定原因

- 最初の validator 実装では schema required と外部証跡の有無を優先し、値の品質検査は URL/Git/AWS 整合性から段階的に追加していた。
- fixture が Git/CloudFormation/checklist の不整合を中心にしており、manifest 内の空値・draft 値を個別に落とすケースが不足していた。

### 根本原因

- 「manifest に記録されている」ことを、key の存在ではなく最終検収で使える値が入っていることとして validator に明示できていなかった。
- 必須値の品質を fixture で固定していなかった。

### 影響範囲

- final evidence candidate validator。
- AC-001 / AC-002 / AC-004 / AC-150 / AC-151 / AC-152 の最終判定前 preflight。
- final acceptance runbook の manifest 確認観点。

### 対策

- `cdk_app_version`、`db_migration.tool`、`db_migration.latest_version`、`cost_estimate.assumption` を final text として検査する。
- `db_migration.tool` は受入条件例に合わせて `Flyway` を要求する。
- fixture に required value invalid ケースを追加する。
- runbook に manifest の必須値が空・draft・pending ではないことを追記する。

## スコープ

- 対象:
  - `tools/final-evidence-candidate.js`
  - `tools/check-final-evidence-candidate-fixtures.js`
  - `docs/ops/runbooks/final-acceptance.md`
- 対象外:
  - GitHub release 作成
  - Git tag 作成や push
  - AWS deploy / publish
  - final checklist signoff

## 実装計画

1. final evidence candidate validator に manifest required value checks を追加する。
2. fixture に empty/draft required value ケースを追加する。
3. final acceptance runbook に manifest required value の確認観点を追記する。
4. 検証結果と PR コメント URL を task に記録する。

## ドキュメント保守計画

- `docs/ops/runbooks/final-acceptance.md` に、manifest の必須値が最終値であることを追記する。

## 受け入れ条件

- [x] `cdk_app_version` が空または draft 値の場合、validator が invalid として検出する。
- [x] `db_migration.tool` が `Flyway` でない場合、validator が invalid として検出する。
- [x] `db_migration.latest_version` が空または draft 値の場合、validator が invalid として検出する。
- [x] `cost_estimate.assumption` が空または draft 値の場合、validator が invalid として検出する。
- [x] valid fixture は引き続き ready と判定される。
- [x] 外部状態を変更せず、release / AWS / final signoff の pending 状態を維持する。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run docs:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files docs/ops/runbooks/final-acceptance.md tools/final-evidence-candidate.js tools/check-final-evidence-candidate-fixtures.js tasks/do/20260527-1758-final-manifest-required-value-gate.md reports/working/20260527-1800-final-manifest-required-value-gate.md`: pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553066397
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4553068706
- GitHub Apps comment は既に 403 `Resource not accessible by integration` を確認済みのため、`gh pr comment` で代替した。

## PR レビュー観点

- required key の存在確認だけでなく、最終検収値として使える値を検査しているか。
- draft/pending 値を拒否しつつ、正当な version string や UAT assumption を過度に狭めていないか。
- 外部状態変更が含まれていないか。

## リスク

- `db_migration.tool` を `Flyway` 固定にするため、将来 migration tool を変更する場合は validator と受入証跡 schema の更新が必要。
