# AWS dev/UAT raw output ref 検査強化

状態: in_progress

## 背景

AWS dev/UAT raw input には `capture_provenance.commands[].output_ref` を必須化済みである。しかし現状は文字列としての存在だけを検査しており、raw output 本体が保存されているかまでは確認していない。

## 目的

`output_ref` を raw input ファイルからの相対パスとして解決し、参照先ファイルの存在を builder で検査する。これにより、final evidence の provenance が取得コマンドと raw output 本体の両方を指す状態へ近づける。

## タスク種別

機能追加

## スコープ

- `capture_provenance.commands[].output_ref` の相対パス解決と存在検査を builder に追加する。
- `output_ref` 欠落だけでなく、参照先ファイル欠落でも fixture check が fail する negative path を追加する。
- sample raw output files を `docs/acceptance/evidence/raw/` に追加する。
- runbook / local verification に raw output ref の存在要件を追記する。
- 実 AWS raw output の取得自体は実行しない。

## 実施計画

1. builder の provenance 検査に output ref resolver を追加する。
2. sample raw output files を追加する。
3. fixture check に missing raw output negative path を追加する。
4. docs を同期する。
5. targeted checks と `npm run verify` を実行する。
6. commit/push、PR コメント、task done まで進める。

## ドキュメント保守計画

- `docs/ops/runbooks/aws-dev-uat-validation.md` に `output_ref` の相対パス・存在要件を追記する。
- `docs/ops/local-verification.md` に raw output ref fixture check を追記する。

## 受け入れ条件

- [ ] `output_ref` が raw input ファイルからの相対パスとして存在検査される。
- [ ] `output_ref` 参照先が存在しない場合、builder/checker が fail する。
- [ ] sample raw output files が repository に存在し、fixture check が pass する。
- [ ] runbook / local verification が raw output ref 要件と同期している。
- [ ] `git diff --check`、targeted checks、`npm run verify` が pass する。
- [ ] PR に受け入れ条件確認とセルフレビューコメントを追加できる。

## 検証計画

- `npm run aws:dev-uat:evidence:fixture:check`
- `npm run docs:check`
- `npm run acceptance:package:check`
- `git diff --check`
- `npm run verify`

## PR レビュー観点

- raw output ref が存在することを builder が実際に検査していること。
- sample raw output が最終検収 evidence と誤認されないこと。
- 実 AWS 操作を自動実行していないこと。

## リスク

- sample raw output は fixture であり、実 AWS output の真正性を証明しない。
- 実 AWS credentials がないため、実 output の取得は引き続き未実施である。
