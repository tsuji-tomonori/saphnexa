# operator runbook validation suite gates

- 状態: done
- タスク種別: 機能追加
- ブランチ: `codex/aws-dev-uat-preflight`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/2

## 背景

AWS dev/UAT の最終検証では `npm run test:e2e:aws`、`npm run perf:aws`、`npm run rag:quality:aws`、`npm run aws:dev-uat:validation:final` が必要である。handoff の `critical_command_order` と external action plan にはこれらが含まれているが、operator execution runbook の `validation_materialization` phase には validation evidence build と final gate だけがあり、suite gate commands が明示されていない。

## 目的

operator execution runbook だけを見ても AWS dev/UAT E2E・性能・RAG品質 suite gate の実行順序が分かるようにし、7 の実行手順の取り違えを防ぐ。

## スコープ

- `tools/aws-dev-uat-operator-execution-runbook.js` に validation suite gate commands を追加する。
- `tools/check-aws-dev-uat-operator-execution-runbook.js` と fixture を更新する。
- runbook / local verification / docs check phrase を更新する。

## 実装方針

1. validation materialization phase で evidence build の後、validation final gate の前に E2E / performance / RAG quality suite gate commands を追加する。
2. ready runbook でも placeholder を含まない fixed command として扱う。
3. validator で suite gate commands の存在と順序を検査する。
4. fixture で ready runbook の validation phase に suite gate commands が含まれることを検査する。

## ドキュメント保守方針

`docs/ops/runbooks/aws-dev-uat-validation.md` と `docs/ops/local-verification.md` を更新する。README/API 例/AGENTS.md は operator runbook の詳細変更範囲外のため更新不要。

## 受け入れ条件

- [x] operator execution runbook の validation phase に `npm run test:e2e:aws` が含まれる。
- [x] operator execution runbook の validation phase に `npm run perf:aws` が含まれる。
- [x] operator execution runbook の validation phase に `npm run rag:quality:aws` が含まれる。
- [x] suite gate commands は validation evidence build の後、`npm run aws:dev-uat:validation:final` の前に並ぶ。
- [x] fixture / docs check が suite gate の存在と説明を検査する。

## 検証計画

- `npm run aws:dev-uat:operator-runbook:check`
- `npm run aws:dev-uat:operator-runbook:fixture:check`
- `npm run docs:check`
- `git diff --check`
- 変更範囲に応じて `npm run verify`

## 検証結果

- `npm run aws:dev-uat:operator-runbook:check`: pass（`requires_resolved_operator_input`）
- `npm run aws:dev-uat:operator-runbook:fixture:check`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass
- `npm run verify`: pass
- `aws sts get-caller-identity --output json`: fail（`Unable to locate credentials.`）

## 作業レポート

- `reports/working/20260528-2217-operator-runbook-validation-suite-gates.md`

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4564344546
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4564347810

## PR レビュー観点

- runbook が外部状態を変更せず、実行順序の記録に留まっていること。
- suite gate commands が final validation gate より前に固定されていること。
- 実 AWS 検証済みと誤認させないこと。

## リスク

- AWS credentials がないため、実 AWS dev/UAT E2E・性能・RAG品質 suite gate は今回も未実行。
- runbook の可視性向上であり、実 captured evidence の代替ではない。
