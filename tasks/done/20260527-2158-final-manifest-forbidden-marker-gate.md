# final manifest forbidden marker gate

- 状態: done
- タスク種別: 機能追加
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

`docs/ops/runbooks/final-acceptance.md` は、final evidence manifest に `placeholder`、`draft`、`example`、`pending` が含まれないことを最終検証条件としている。既存 validator は主要テキストや一部 URL の placeholder / pending を拒否しているが、artifact URL などの任意文字列に `draft` や `not-for-acceptance` が紛れ込む余地がある。

## 目的

final evidence manifest 全体の文字列値に draft / placeholder 系 marker が残っている場合、final candidate を ready にしない。

## スコープ

- `tools/final-evidence-candidate.js` に manifest 全体の forbidden marker 検査を追加する。
- `tools/check-final-evidence-candidate-fixtures.js` に artifact URL 内の `draft` marker を拒否する fixture を追加する。

## スコープ外

- Git tag/release の作成
- AWS deploy/publish
- CloudFormation capture
- final evidence manifest / final checklist の実作成または署名

## 受け入れ条件

- [x] final evidence manifest の任意の文字列値に `draft` / `placeholder` / `example` / `pending` / `not-for-acceptance` が含まれる場合、`acceptance:final-candidate:fixture:check` が失敗として検出する。
- [x] artifact URL の path suffix や deployment source が正しくても、URL 内に forbidden marker が含まれる場合は拒否する。
- [x] 既存の ready fixture は引き続き ready になる。
- [x] final acceptance の外部残件を完了扱いしない。
- [x] 変更範囲に見合う検証を実行し、結果を task / report / PR コメントに残す。

## Done 条件

- [x] 実装と fixture を追加する。
- [x] 選定した検証コマンドが pass する。
- [x] 作業レポートを `reports/working/` に作成する。
- [x] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [x] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. manifest object の全 string 値を path label 付きで走査する。
2. forbidden marker があれば `manifest.no_forbidden_markers.<path>` として error に出す。
3. artifact URL に `draft` を含む fixture を追加する。
4. targeted check と broad verification を実行する。

## ドキュメント保守方針

runbook に既に検証条件があるため、追加 docs は不要。実装差分、task、report、PR コメントに検査強化内容を記録する。

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

- 実 URL や説明文に `draft` などを含む正当な名称を使うと final candidate が拒否される。final acceptance の提出物では、runbook の条件に合わせて最終証跡 URL / 説明から draft marker を排除する運用が妥当と判断する。

## 実施結果

- 実装 commit: `adaa995`
- 作業レポート: `reports/working/20260527-2222-final-manifest-forbidden-marker-gate.md`
- PR 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4554909859
- PR セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4554912974

## 検証結果

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass（final candidate は最終ファイル未作成のため not ready）
- `npm run acceptance:package:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files tools/final-evidence-candidate.js tools/check-final-evidence-candidate-fixtures.js tasks/do/20260527-2158-final-manifest-forbidden-marker-gate.md`: pass
- `pre-commit run --files reports/working/20260527-2222-final-manifest-forbidden-marker-gate.md`: pass

## 残件

- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence manifest / checklist の最終作成・署名は未実施。
- `dist/acceptance/final_readiness.json` は `final_acceptance_ready: false` のまま扱う。
