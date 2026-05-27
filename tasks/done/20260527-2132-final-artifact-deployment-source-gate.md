# final artifact deployment source gate

- 状態: done
- タスク種別: 機能追加
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

final evidence manifest の docs / Allure / RAG evaluation URL は path suffix と public URL 性を検査しているが、公開 URL であれば CloudFormation で capture した検収環境の CloudFront distribution / admin artifacts bucket と無関係な配置先でも通る余地がある。

## 目的

final evidence manifest の artifact URL が、最終 CloudFormation inventory に含まれる `DistributionDomainName` または `AdminArtifactsBucketArn` に由来する配置先を指すことを検査し、外部 bucket / host を最終 artifact として扱わない。

## スコープ

- `tools/final-evidence-candidate.js` に manifest artifact URL と CloudFormation inventory outputs の整合検査を追加する。
- `tools/check-final-evidence-candidate-fixtures.js` に無関係な artifact deployment source を拒否する fixture を追加する。
- 既存の ready fixture は CloudFormation inventory の admin artifacts bucket と整合するよう調整する。

## スコープ外

- AWS deploy/publish の実行
- CloudFormation inventory の実 capture
- Git tag / GitHub release の作成
- final evidence manifest / checklist の実作成と signoff

## 受け入れ条件

- [x] final manifest の artifact URL が CloudFormation inventory の CloudFront distribution / admin artifacts bucket と無関係な場合、`acceptance:final-candidate:fixture:check` が失敗として検出する。
- [x] CloudFormation inventory と整合する ready fixture は引き続き ready になる。
- [x] final acceptance の外部残件を完了扱いしない。
- [x] 変更範囲に見合う検証を実行し、結果を task / report / PR コメントに残す。

## Done 条件

- [x] 実装と fixture を追加する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [x] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [x] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実施結果

- 実装 commit: `b5468d3` `✅ test: final artifact deployment source検査を追加`
- 作業レポート: `reports/working/20260527-2134-final-artifact-deployment-source-gate.md`
- PR 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4554551720
- PR セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4554554490

## 検証結果

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass。final files 未配置のため status は `not_ready` のまま。
- `npm run acceptance:package:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files tools/check-final-evidence-candidate-fixtures.js tools/final-evidence-candidate.js tasks/do/20260527-2132-final-artifact-deployment-source-gate.md`: pass
- `pre-commit run --files reports/working/20260527-2134-final-artifact-deployment-source-gate.md`: pass

## 残件

- final acceptance は未完了。Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final checklist signoff は pending。

## 実装計画

1. CloudFormation inventory outputs から distribution domain と admin artifacts bucket を抽出する。
2. manifest の test_reports / docs_site / rag_evaluation artifact URL が、抽出した deployment source と一致するか検査する。
3. 無関係な HTTPS host / S3 bucket を含む fixture を追加する。
4. targeted check と broad verification を実行する。

## ドキュメント保守方針

schema の required field は変更しない。final candidate の検査強化として task / report / PR コメントに根拠を残す。schema description 更新が必要な場合のみ同じ差分に含める。

## 検証計画

- `npm run acceptance:final-candidate:fixture:check`
- `npm run acceptance:final-candidate:check`
- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## PR セルフレビュー観点

- docs と実装の同期
- 変更範囲に見合うテスト
- RAG の根拠性・認可境界を弱めていないこと
- benchmark 期待語句・QA sample 固有値・dataset 固有分岐を実装へ入れていないこと

## リスク

- 最終環境で CloudFront alias custom domain を使う場合、inventory outputs 側にも alias を明示する必要がある。現時点では基本設計の CloudFront distribution / S3 admin artifacts bucket に基づく検査として実装する。
