# final aws account placeholder gate

- 状態: do
- タスク種別: 機能追加
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

final acceptance runbook は、final evidence manifest の AWS account id が「実 12 桁」であることを要求している。既存 validator は 12 桁形式と `000000000000` の拒否を行っているが、AWS サンプルで多用される `123456789012` や同一数字 12 桁などの placeholder 風 account id を final 証跡として拒否していない。

## 目的

final evidence manifest の `aws_account_id` に common placeholder account id が残っている場合、final candidate を ready にしない。

## スコープ

- `tools/final-evidence-candidate.js` に実 AWS account id 判定 helper を追加する。
- `tools/check-final-evidence-candidate-fixtures.js` に `123456789012` を拒否する fixture を追加する。
- ready fixture の AWS account id を common placeholder ではない値に更新する。

## スコープ外

- AWS account の実在性を AWS API で照会すること
- AWS deploy/publish
- CloudFormation capture
- final evidence manifest / final checklist の実作成または署名

## 受け入れ条件

- [ ] final evidence manifest の `aws_account_id` が `000000000000`、`123456789012`、同一数字 12 桁の場合、final candidate validator が拒否する。
- [ ] `123456789012` を含む fixture が ready にならない。
- [ ] 既存の ready fixture は非 placeholder account id で引き続き ready になる。
- [ ] final acceptance の外部残件を完了扱いしない。
- [ ] 変更範囲に見合う検証を実行し、結果を task / report / PR コメントに残す。

## Done 条件

- [ ] 実装と fixture を追加する。
- [ ] 選定した検証コマンドが pass する。
- [ ] 作業レポートを `reports/working/` に作成する。
- [ ] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [ ] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. `isRealAwsAccountId` helper を追加し、形式、ゼロ値、同一数字、`123456789012` を拒否する。
2. manifest の `aws_account_id` check を helper 経由に変更する。
3. ready fixture の account id と関連 ARN を非 placeholder 値へ更新する。
4. placeholder account fixture を追加し、拒否されることを確認する。

## ドキュメント保守方針

final runbook に既に「AWS account id は実 12 桁」とあるため、docs 本文更新は不要。実装差分、task、report、PR コメントに gate 強化内容を記録する。

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

- AWS account id の実在性まではローカルでは検証しない。AWS API 照会は外部 account 依存のため、今回の local gate では common placeholder を拒否する範囲に限定する。
