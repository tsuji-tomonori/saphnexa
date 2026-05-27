# final readiness artifact summary gate

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-27 16:47 JST
- 対象 PR: #1

## 背景

AC-002 の提出成果物一覧は `dist/acceptance/artifact_summary.draft.json` として acceptance package に追加された。一方、final readiness は release/AWS/checklist/final candidate/external action gate を持つが、artifact summary gate をまだ持たないため、最終検収前に提出物一覧の local ready / pending external 状態を readiness 側で直接確認しにくい。

## 目的

final readiness に artifact summary gate を追加し、AC-002 の提出成果物一覧と pending external 状態が final readiness check でも機械検査されるようにする。

## スコープ

- artifact summary 生成ロジックを shared module 化し、package build と final readiness から同じ定義を参照する。
- final readiness に artifact summary gate を追加する。
- final readiness checker で artifact summary gate の schema、必須カテゴリ、pending external 状態を検査する。
- package checker の既存検査を維持する。

## 実装チェックリスト

- [x] artifact summary 生成ロジックを shared module 化する。
- [x] final readiness に artifact summary gate を追加する。
- [x] final readiness checker で artifact summary gate を検査する。
- [x] package checker と package build の既存挙動を維持する。
- [x] 対象検証と `npm run verify` を通す。
- [x] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552566952
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552569011

## Done 条件

- `npm run acceptance:final:check` が artifact summary gate を検査して pass する。
- `npm run acceptance:package:check` が artifact summary draft の既存検査を維持して pass する。
- `npm run verify`、`git diff --check`、pre-commit が pass する。
- GitHub Actions の PR checks が pass する。

## 受け入れ条件

- AC-002: final readiness で提出成果物一覧の local ready / pending external 状態を確認できる。
- AC-001/004/081/150/151/152: final evidence や AWS capture が未実施の項目を完了扱いにせず、pending として残す。

## 検証計画

- `npm run acceptance:final:check`
- `npm run acceptance:package:check`
- `npm run acceptance:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## ドキュメント保守計画

- traceability への追加が必要か確認し、既存の AC-002 根拠で足りる場合は作業レポートに理由を記録する。

## PR レビュー観点

- package build と final readiness が artifact summary 定義を二重管理していないこと。
- final readiness が pending external を ready と誤判定しないこと。
- Git tag/release、AWS deploy/publish、final checklist signoff を実施済み扱いにしていないこと。

## リスク・制約

- この作業は readiness gate の検査強化であり、Git tag/release、AWS deploy/publish、CloudFormation capture、final checklist signoff は実行しない。
