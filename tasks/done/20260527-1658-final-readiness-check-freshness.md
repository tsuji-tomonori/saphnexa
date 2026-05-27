# final readiness check freshness

- 状態: done
- タスク種別: 修正
- 作成日時: 2026-05-27 16:58 JST
- 対象 PR: #1

## 背景

`npm run acceptance:final:check` は `dist/acceptance/final_readiness.json` を読むだけで、生成元の `tools/final-acceptance-readiness.js` 変更後に `npm run acceptance:final:build` を実行していない場合、古い readiness を検査して失敗または誤判定する可能性がある。直近の final readiness artifact summary gate でも、古い `dist` を読んだ初回 `acceptance:final:check` が失敗した。

## なぜなぜ分析

### 問題文

2026-05-27 16:50 JST 頃、final readiness の schema を変更した後、`npm run acceptance:final:check` が古い `dist/acceptance/final_readiness.json` を読み、追加した `artifact_summary_gate` が存在しないため失敗した。

### 確認済み事実

- `package.json` の `acceptance:final:check` は `node tools/check-final-acceptance-readiness.js` のみを実行する。
- `tools/check-final-acceptance-readiness.js` は既存の `dist/acceptance/final_readiness.json` を読む。
- `npm run acceptance:final:build` を実行して readiness を再生成すると、同じ check は pass した。
- `acceptance:package:check` は build を内包しており、同種の stale draft を避ける導線になっている。

### 推測・未確認

- CI/verify では `acceptance:final:build` の直後に `acceptance:final:check` を実行するため、この問題は主に単独実行や変更直後の手元検証で表面化する。

### 根本原因

- final readiness check が生成物の freshness を保証しない設計で、check が依存する `dist` を自動更新しない。
- package check と final readiness check の実行導線が非対称で、同じ acceptance draft 検査でも stale artifact の扱いが異なる。

### 対策方針

- `npm run acceptance:final:check` の実行時に readiness を再生成してから検査する。
- docs / runbook 上では、明示的な `acceptance:final:build` も残し、最終検収順序の見通しを維持する。

## 目的

`npm run acceptance:final:check` を単独実行しても最新の final readiness を検査できるようにし、stale `dist` による false failure / false confidence を防ぐ。

## スコープ

- `acceptance:final:check` が `acceptance:final:build` を内包するようにする。
- local verification docs に freshness 保証を明記する。
- final readiness / package / docs の既存検査を維持する。

## 実装チェックリスト

- [x] `acceptance:final:check` の script を self-refreshing にする。
- [x] local verification docs に final readiness check freshness を追記する。
- [x] 対象検証と `npm run verify` を通す。
- [x] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552623492
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552625401
- task 完了更新セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552636442

## GitHub Actions

- 最新 push `8896345` 後の PR checks: pass
- Run: `26498827236`, `26498828491`
- 対象 job: lint / typecheck / unit / integration / e2e / security scan / license scan / cdk synth / cdk diff / contract generation diff / db observability / admin offline restore / admin artifacts / quality gates

## Done 条件

- `npm run acceptance:final:check` 単独実行で readiness build と check が pass する。
- `npm run docs:check`、`npm run ci:check`、`npm run acceptance:package:check` が pass する。
- `npm run verify`、`git diff --check`、pre-commit が pass する。
- GitHub Actions の PR checks が pass する。

## 受け入れ条件

- AC-001/004/150/151/152: final readiness check が最新の release/AWS/checklist/final candidate 状態を反映し、stale draft を検査しない。
- AC-002/081: artifact summary / CloudFormation 関連 gate の追加後も final readiness check が最新生成物を検査する。

## 検証計画

- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run docs:check`
- `npm run ci:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## ドキュメント保守計画

- `docs/ops/local-verification.md` に `acceptance:final:check` が readiness を再生成して検査することを追記する。

## PR レビュー観点

- final readiness check が stale `dist` を読まないこと。
- final readiness build/check の明示手順と CI command order が矛盾しないこと。
- 外部 action や final checklist signoff を実施済み扱いにしていないこと。

## リスク・制約

- `acceptance:final:check` 内で build を再実行するため、`verify` では `acceptance:final:build` と重複する。ただし生成は軽量であり、stale check 防止を優先する。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final checklist signoff は未実行。
