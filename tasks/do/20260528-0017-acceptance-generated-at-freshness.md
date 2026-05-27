# acceptance generated_at freshness

- 状態: do
- タスク種別: 修正
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

`acceptance:final:check` と `acceptance:package:check` は生成物を再生成してから検査する導線になっている。一方、生成される `generated_at` や draft checklist の `確認日` は複数箇所で `2026-05-27` 固定値のままであり、実行日が変わった後の acceptance 証跡 freshness と矛盾する。

## 問題文

2026-05-28 時点の PR branch で、acceptance draft / readiness / action plan / CloudFormation draft の生成物が、実行時刻ではなく `2026-05-27` 固定の `generated_at` / `確認日` を出力する。

## 軽量なぜなぜ / RCA

- 確認済み事実:
  - `tools/final-acceptance-readiness.js`、`tools/external-acceptance-actions.js`、`tools/acceptance-artifact-summary.js`、`tools/cloudformation-inventory.js`、`tools/build-acceptance-package.js` は `generated_at` を固定文字列で出力している。
  - `tools/build-acceptance-package.js` は draft checklist の `確認日` も固定文字列で出力している。
  - `acceptance:final:check` / `acceptance:package:check` は生成を内包しているため、実行時刻を出力できる。
- 推定原因:
  - 初期実装時に deterministic artifact を優先し、検収証跡としての生成時刻 freshness までは検査対象にしていなかった。
- 根本原因:
  - 生成物の freshness を保証する共通 time helper と check がなかった。
- 影響範囲:
  - 最終検収前の draft 証跡や readiness が、いつ生成されたかを誤って示す可能性がある。
- 対策:
  - 実生成物に current JST timestamp/date を出力する helper を追加し、check で当日生成であることを検査する。fixture の固定日時は維持する。

## 目的

acceptance 系の実生成物が実行時点の JST 日付・時刻を記録し、stale 固定日付を証跡として残さないようにする。

## スコープ

- `tools/lib.js` に current JST timestamp/date helper を追加する。
- acceptance package / final readiness / external action plan / artifact summary / CloudFormation draft の `generated_at` を current JST timestamp にする。
- draft checklist の `確認日` を current JST date にする。
- checker に `generated_at` / `確認日` の当日検査を追加する。

## スコープ外

- fixture の固定日時変更
- final evidence candidate の実作成
- Git tag/release、AWS deploy/publish、CloudFormation capture、final signoff

## 受け入れ条件

- [x] acceptance package summary の `generated_at` が実行日 JST の timestamp になる。
- [x] artifact summary の `generated_at` が実行日 JST の timestamp になる。
- [x] final readiness の `generated_at` が実行日 JST の timestamp になる。
- [x] external action plan の `generated_at` が実行日 JST の timestamp になる。
- [x] CloudFormation draft inventory の `generated_at` が実行日 JST の timestamp になる。
- [x] final candidate status の `generated_at` が実行日 JST の timestamp になる。
- [x] draft checklist の `確認日` が実行日 JST の date になる。
- [x] checker が上記 freshness を検査する。
- [x] 外部 action は未実行 / pending のまま維持する。

## Done 条件

- [ ] helper / builders / checkers を更新する。
- [ ] 選定した検証コマンドが pass する。
- [ ] 作業レポートを `reports/working/` に作成する。
- [ ] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [ ] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. `tools/lib.js` に `currentJstTimestamp` / `currentJstDate` / freshness check helper を追加する。
2. acceptance builders の固定 `generated_at` / `確認日` を helper 利用へ置き換える。
3. `check-*` に当日 JST 生成であることの検査を追加する。
4. package/final/cfn/external/docs/verify を実行する。
5. 作業レポート、commit / push、PR コメント、task done 更新を行う。

## ドキュメント保守方針

ユーザー向け手順は変更しない。生成物の freshness の実装・検査強化であり、docs 変更は原則不要。

## 検証計画

- `npm run cfn:inventory:check`
- `npm run acceptance:external-actions:check`
- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

- pass: `npm run cfn:inventory:build && npm run cfn:inventory:check`
- pass: `npm run acceptance:external-actions:check`
- pass: `npm run acceptance:final-candidate:check`
- pass: `npm run acceptance:final:check`
- pass: `npm run acceptance:package:check`
- pass: `npm run verify`
- pass: `git diff --check`
- pass: `pre-commit run --files tools/lib.js tools/cloudformation-inventory.js tools/check-cloudformation-inventory.js tools/external-acceptance-actions.js tools/check-external-acceptance-actions.js tools/final-evidence-candidate.js tools/check-final-evidence-candidate.js tools/final-acceptance-readiness.js tools/check-final-acceptance-readiness.js tools/acceptance-artifact-summary.js tools/build-acceptance-package.js tools/check-acceptance-package.js tasks/do/20260528-0017-acceptance-generated-at-freshness.md reports/working/20260528-0017-acceptance-generated-at-freshness.md`

## 実施結果

- `tools/lib.js` に JST timestamp/date helper と current date 判定 helper を追加した。
- acceptance package summary、artifact summary、final readiness、external action plan、CloudFormation draft inventory、final candidate status の `generated_at` を current JST timestamp にした。
- acceptance package draft checklist の `確認日` を current JST date にした。
- 対応する checker に generated_at / 確認日 の freshness 検査を追加した。
- 外部 action は実行せず、pending のまま維持した。

## PR セルフレビュー観点

- docs と実装の同期
- 変更範囲に見合うテスト
- RAG の根拠性・認可境界を弱めていないこと
- benchmark 期待語句・QA sample 固有値・dataset 固有分岐を実装へ入れていないこと

## リスク

- 生成物の timestamp が実行ごとに変わる。`dist/` は acceptance draft 出力であり、検証は build + check 導線で freshness を保証する。
