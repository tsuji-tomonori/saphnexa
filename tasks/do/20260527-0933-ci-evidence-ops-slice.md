# CI・証跡・運用検証スライス

## 背景

- 前回スライスで Saphnexa 基本設計 v0.16 に沿ったローカル実装基盤、API/Tools 契約、DB migration、RAG fixture、acceptance trace を追加した。
- 検収 package v1.0 では CI 必須ジョブ、証跡マニフェスト、運用手順、secret scan、最小権限、共通 JSON ログ、trace 伝播などがまだ未達である。

## 目的

- GitHub Actions とローカル検証 scripts を追加し、AC-120/125 の土台を作る。
- `evidence_manifest.json` の提出に向けた example と schema 検査を追加する。
- AC-143/144 に向け、最低限の運用 runbook と DR runbook を追加する。
- AC-046/048/110/111 に向け、secret scan、IAM/infra baseline、JSON log schema、trace propagation の静的検査を追加する。

## スコープ

- `.github/workflows/ci.yml`
- `tools/check-*.js` 系の静的検証 scripts
- `package.json` と `Taskfile.yml` の検証タスク
- `docs/acceptance/traceability.md` の状態更新
- `docs/acceptance/evidence/evidence_manifest.example.json`
- `docs/ops/runbooks/*.md`
- CI/証跡/運用系の node test

## スコープ外

- GitHub Actions 実 run の green 証跡確定。
- AWS dev/UAT での CloudFormation、DSQL、S3、CloudWatch、Bedrock、AppSync、AgentCore 実証跡。
- 本番 deploy、release、tag 作成。

## タスク種別

機能追加

## チェックリスト

- [x] CI workflow に検収 package の 10 必須 job 名を定義する。
- [x] ローカルで workflow/job 定義を検査する script を追加する。
- [x] evidence manifest example と schema 互換検査を追加する。
- [x] acceptance trace の全 AC 記載と状態値を機械検査する。
- [x] secret scan、license scan、repo lint、docs check、local CDK inventory check を追加する。
- [x] 共通 JSON log schema と trace propagation の検査を追加する。
- [x] 6 運用 runbook と DR runbook を追加する。
- [x] 検証を実行し、失敗があれば修正して再実行する。
- [x] 作業レポートを作成し、commit / push / PR コメント更新まで行う。

## Done 条件

- Deliverables:
  - `.github/workflows/ci.yml` が存在し、lint/typecheck/unit/integration/e2e/cdk synth/cdk diff/security/license/contract diff の 10 job を持つ。
  - evidence manifest example が schema 互換である。
  - acceptance trace が全 AC ID を含み、状態値が許可集合に収まる。
  - 運用 runbook 6 件と DR runbook が存在する。
  - 作業レポートが存在する。
- Validations:
  - `npm test` pass
  - `npm run verify` pass
  - `npm run ci:check` pass
  - `npm run docs:check` pass
  - `npm run security:scan` pass
  - `npm run evidence:check` pass
  - `git diff --check` pass
  - `pre-commit run --files <changed-files>` pass

## 受け入れ条件

- [ ] CI workflow の 10 job が検収 package の AC-120 と対応している。
- [ ] contract/schema/trace/evidence の生成差分検出に相当するローカル検査がある。
- [ ] secret/token/domain 漏えいの静的 scan が存在し、現在の差分で pass する。
- [ ] 共通 JSON ログ schema と trace_id/correlation_id 伝播の最小検査が存在する。
- [ ] 運用手順 6 件と backup/restore 手順が docs に追加される。
- [ ] 未実施の AWS/CI 実証跡は実施済みにせず、trace/report/PR コメントに残る。

## 検証計画

- `npm test`
- `npm run verify`
- `npm run ci:check`
- `npm run docs:check`
- `npm run security:scan`
- `npm run evidence:check`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `npm run evidence:check`: pass
- `npm run acceptance:check`: pass
- `npm run security:scan`: pass
- `npm run verify`: pass
- `npm test`: pass
- `git diff --check`: pass

## ドキュメント保守方針

- 運用者が使う恒久手順は `docs/ops/runbooks/` に置く。
- 検収証跡の提出準備は `docs/acceptance/evidence/` に置く。
- 作業経緯と未完了範囲は `reports/working/` に置く。

## PR レビュー観点

- CI job 名が検収 package の AC-120 と対応していること。
- workflow や scripts が実施していない AWS 実証跡を pass 扱いにしていないこと。
- secret scan が実 secret 値や token をログ/成果物へ出さないこと。
- runbook が操作対象、前提、手順、検証、rollback/報告を含むこと。

## リスク

- GitHub Actions の実 run は push 後に GitHub 側で確認が必要であり、ローカル検査だけでは AC-120 PASS ではない。
- evidence manifest example は placeholder を含むため、検収提出用の final manifest ではない。

## 状態

in_progress
