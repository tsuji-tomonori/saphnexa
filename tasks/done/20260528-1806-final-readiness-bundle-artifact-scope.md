# final readiness bundle artifact scope gate

- 状態: done
- タスク種別: 機能追加
- ブランチ: `codex/aws-dev-uat-preflight`
- PR: https://github.com/tsuji-tomonori/saphnexa/pull/2

## 背景

AWS dev/UAT の最終証跡 bundle は、raw input、raw output、final evidence、execution bridge の現在対象だけを含む必要がある。現行 final readiness は artifact の digest/size 一致を検査するが、manifest に余計な artifact が混入しても、そのファイルが存在し metadata が一致する場合に範囲外 artifact として明示的に reject しない。

## 目的

final readiness が evidence bundle manifest 内の全 artifact を現在の raw input から導ける期待 artifact 範囲に限定し、範囲外 artifact が混入した場合に `invalid_evidence_bundle_manifest` として止める。

## スコープ

- `tools/aws-dev-uat-final-readiness.js` の evidence bundle state に全 artifact scope 検査を追加する。
- `tools/check-aws-dev-uat-final-readiness.js` の schema/readiness assertion を更新する。
- fixture に範囲外 artifact 混入の negative path を追加する。
- 関連 docs と docs check phrase を更新する。

## 実装方針

1. preflight / validation raw input から raw output artifact の期待 path を導出する。
2. required artifact と raw output artifact を統合した期待 artifact scope を作る。
3. manifest の全 artifact について kind/mode/path が期待 scope に一致するかを `scope_matches` として記録する。
4. 1 件でも範囲外 artifact があれば `all_artifacts_scope_matches: false` とし、final readiness を blocked にする。

## ドキュメント保守方針

`docs/ops/runbooks/aws-dev-uat-validation.md` と `docs/ops/local-verification.md` の final readiness 説明を更新する。README/API 例/AGENTS.md は挙動変更範囲外のため更新不要と判断する。

## 受け入れ条件

- [x] final readiness manifest が全 bundle artifact の scope match 状態を出力する。
- [x] 範囲外 artifact が混入した evidence bundle manifest は `invalid_evidence_bundle_manifest` で blocked になる。
- [x] ready 状態では全 artifact の scope と metadata が一致することを validator が要求する。
- [x] fixture check が範囲外 artifact の negative path を検査する。
- [x] docs が bundle artifact scope gate を説明し、docs check が stale doc を検出できる。

## 検証計画

- `npm run aws:dev-uat:final-readiness:check`
- `npm run aws:dev-uat:final-readiness:fixture:check`
- `npm run docs:check`
- `git diff --check`
- 変更範囲に応じて `npm run verify`

## 検証結果

- `npm run aws:dev-uat:final-readiness:check`: pass（`blocked_by_external_execution`）
- `npm run aws:dev-uat:final-readiness:fixture:check`: pass
- `npm run docs:check`: pass
- `git diff --check`: pass
- `npm run verify`: pass
- `aws sts get-caller-identity --output json`: fail（`Unable to locate credentials.`）

## 作業レポート

- `reports/working/20260528-1810-final-readiness-bundle-artifact-scope.md`

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4564219457
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/2#issuecomment-4564222023

## PR レビュー観点

- 範囲外 artifact の検査が raw output を含む全 artifact に効くこと。
- metadata mismatch と scope mismatch の blocker が区別して読み取れること。
- 実 AWS deploy / E2E / performance / RAG quality 実行済みとは表現していないこと。

## リスク

- 実 AWS credentials がないため、dev/UAT 実環境の deploy、migration、publish、E2E、性能、RAG 品質検証は今回も未実施。
- raw input が欠けている場合、raw output scope は導出できないため、最終 ready 条件では raw input が先に必要になる。
