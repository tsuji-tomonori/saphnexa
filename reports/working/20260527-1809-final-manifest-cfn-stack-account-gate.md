# final manifest CloudFormation stack account gate 作業完了レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` をもとに実装し、`.workspace/local.md` を参考にローカル確認を行う。
- `.workspace/Saphnexa_検収受入条件_package_v1.0` を満たすまで作業を継続する。
- repository ルールに従い、task md、検証、commit/PR 更新、作業レポートを残す。

## 要件整理

- final acceptance は外部状態を伴う GitHub release、AWS/UAT 証跡、final checklist signoff が残っており、現時点では完了扱いにできない。
- 外部操作なしで進められる範囲として、最終証跡候補 validator が不整合な CloudFormation stack ARN を誤って通さないようにする。
- 対象は manifest の `cloudformation_stacks` に含まれる各 stack の ARN account、region、stack name。

## 検討・判断の要約

- AC-001 は AWS account / region / deploy 対象 environment の固定を求めており、manifest 配列内の一部 stack だけが正しい状態では証跡として弱い。
- 既存 validator は final inventory と一致する stack の存在を確認しているため、その検査は維持しつつ manifest 配列全体の正規性を追加した。
- AWS 実取得は外部状態を伴うため行わず、local fixture で誤った stack ARN が invalid になることを確認した。

## 実施作業

- `tools/final-evidence-candidate.js` で、各 stack ARN の region/account/name を parse して manifest と照合する検査を追加。
- `tools/check-final-evidence-candidate-fixtures.js` に account mismatch、region mismatch、stack name mismatch の invalid fixture を追加。
- `docs/ops/runbooks/final-acceptance.md` に、manifest 内の全 CloudFormation stack が account/region/name で整合することを追記。
- `tasks/do/20260527-1807-final-manifest-cfn-stack-account-gate.md` を作成し、受け入れ条件と検証結果を記録。

## 成果物

- `tools/final-evidence-candidate.js`
- `tools/check-final-evidence-candidate-fixtures.js`
- `docs/ops/runbooks/final-acceptance.md`
- `tasks/do/20260527-1807-final-manifest-cfn-stack-account-gate.md`

## 検証

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final files 未配置のため `not ready` を正常報告）
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run verify`: pass

## 指示への fit 評価

- 検収 package の AC-001 / AC-002 / AC-081 / AC-150 / AC-151 / AC-152 に向けて、最終証跡が別 account / region / stack name mismatch を含んだまま ready にならない preflight を強化した。
- `.workspace/local.md` の二段構え方針に沿い、ローカルでは証跡 validator と fixture による検証に限定し、AWS 実サービス検証は pending とした。
- 実施していない Git tag、GitHub release、AWS deploy、CloudFormation 実取得、final signoff は実施済み扱いにしていない。

## 未対応・制約・リスク

- final acceptance は未完了。GitHub release、AWS/UAT 証跡、CloudFormation 実取得、final checklist signoff が残っている。
- 複数 account / region をまたぐ検収構成は現行受入条件の対象外。将来許容する場合は validator と受入条件の拡張が必要。
