# operator handoff bundle gate summary

- 状態: do
- タスク種別: 機能追加
- ブランチ: `codex/aws-dev-uat-preflight`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/2

## 背景

final readiness は evidence bundle manifest の schema/status/evidence class/current git/artifact count/coverage/path/digest/metadata/scope を検査するようになった。一方、operator handoff は final readiness path、blockers、next commands を集約しているが、bundle gate の個別状態を handoff JSON で直接読めない。

## 目的

AWS dev/UAT 実行担当者が handoff artifact だけでも evidence bundle gate の状態を把握できるようにし、範囲外 artifact や metadata mismatch の見落としを防ぐ。

## スコープ

- `tools/aws-dev-uat-operator-handoff.js` に final readiness の evidence bundle gate summary を追加する。
- `tools/check-aws-dev-uat-operator-handoff.js` と fixture を更新する。
- local verification / runbook / docs check phrase を更新する。

## 実装方針

1. handoff に `final_readiness_summary.evidence_bundle` を追加する。
2. bundle gate summary には manifest path、ready/current git、artifact count、required artifact coverage、metadata match、scope match、invalid/stale blocker flags を含める。
3. validator と fixture で blocked branch でも summary が出ることを検査する。
4. docs で operator handoff が bundle gate summary を持つことを説明する。

## ドキュメント保守方針

`docs/ops/runbooks/aws-dev-uat-validation.md` と `docs/ops/local-verification.md` を更新する。README/API 例/AGENTS.md は operator handoff の詳細変更範囲外のため更新不要。

## 受け入れ条件

- [x] operator handoff が `final_readiness_summary.evidence_bundle` を出力する。
- [x] summary に artifact count / coverage / metadata match / scope match / blocker flags が含まれる。
- [x] operator handoff validator が bundle gate summary を要求する。
- [x] fixture check が blocked handoff でも bundle gate summary を検査する。
- [x] docs が bundle gate summary を説明し、docs check が stale doc を検出できる。

## 検証計画

- `npm run aws:dev-uat:operator-handoff:check`
- `npm run aws:dev-uat:operator-handoff:fixture:check`
- `npm run docs:check`
- `git diff --check`
- 変更範囲に応じて `npm run verify`

## 検証結果

- `npm run aws:dev-uat:operator-handoff:check`: pass（`blocked_by_external_execution`）
- `npm run aws:dev-uat:operator-handoff:fixture:check`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass
- `npm run verify`: pass
- `aws sts get-caller-identity --output json`: fail（`Unable to locate credentials.`）

## 作業レポート

- `reports/working/20260528-2208-operator-handoff-bundle-gate-summary.md`

## PR レビュー観点

- handoff が外部状態を変更せず、既存の pending/blocked 表現を維持していること。
- summary が final readiness の state を過不足なく反映し、実 AWS 検証済みと誤認させないこと。
- RAG 実装・認可境界・benchmark 固有値を変更していないこと。

## リスク

- AWS credentials がないため、実 AWS dev/UAT 検証は今回も未実施。
- summary は local handoff artifact の可視性向上であり、実 AWS captured evidence の代替ではない。
