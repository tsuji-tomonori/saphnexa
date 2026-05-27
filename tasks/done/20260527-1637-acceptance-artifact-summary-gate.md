# acceptance artifact summary gate

- 状態: done
- タスク種別: 機能追加
- 作成日時: 2026-05-27 16:37 JST
- 対象 PR: #1

## 背景

AC-002 はソース、CDK synth 結果、CloudFormation outputs、DB migration 結果、Allure レポート、Docusaurus 設計書 URL、運用手順の提出を求めている。現状の trace は artifact summary draft を根拠にしているが、acceptance package には独立した artifact summary draft がなく、manifest と summary の分散情報だけでは最終提出物の不足を一覧検査しにくい。

## 目的

acceptance package に AC-002 の提出成果物一覧を表す `artifact_summary.draft.json` を追加し、各成果物が local draft なのか external final evidence pending なのかを機械検査できるようにする。

## スコープ

- `tools/build-acceptance-package.js` で artifact summary draft を生成する。
- `tools/check-acceptance-package.js` で必須成果物カテゴリ、local/external 状態、final evidence pending の扱いを検査する。
- draft manifest / summary から artifact summary path を参照できるようにする。
- trace の AC-002 根拠と実際の package 内容を同期する。

## 実装チェックリスト

- [x] artifact summary draft を生成する。
- [x] acceptance package checker で artifact summary draft を検査する。
- [x] manifest / summary / trace に artifact summary path を反映する。
- [x] 対象検証と `npm run verify` を通す。
- [x] PR へ受け入れ条件コメントとセルフレビューコメントを追加する。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552499465
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552501565
- task 完了更新セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552511545

## GitHub Actions

- 最新 push `cd0291f` 後の PR checks: pass
- Run: `26497953234`, `26497955092`
- 対象 job: lint / typecheck / unit / integration / e2e / security scan / license scan / cdk synth / cdk diff / contract generation diff / db observability / admin offline restore / admin artifacts / quality gates

## Done 条件

- `npm run acceptance:package:check` が artifact summary draft の存在と必須カテゴリを検査して pass する。
- `npm run acceptance:final:check` が final readiness と artifact summary draft の整合性を壊さず pass する。
- `npm run verify`、`git diff --check`、pre-commit が pass する。
- GitHub Actions の PR checks が pass する。

## 受け入れ条件

- AC-002: acceptance package に、提出すべき成果物一覧と local/external pending 状態を示す artifact summary draft が含まれる。
- AC-001/004/081/150/151/152: final evidence や AWS capture が未実施の項目を完了扱いにせず、pending として残す。

## 検証計画

- `npm run acceptance:package:check`
- `npm run acceptance:final:check`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## ドキュメント保守計画

- traceability の AC-002 が指す artifact summary draft と package 実体を同期する。
- README / docs への追加が必要か確認し、不要なら作業レポートに理由を記録する。

## PR レビュー観点

- artifact summary draft が final acceptance の PASS を偽装していないこと。
- GitHub release / AWS deploy / CloudFormation capture / checklist signoff を外部 pending として扱っていること。
- source package の必須成果物と検査カテゴリがずれていないこと。

## リスク・制約

- この作業はローカル draft package の検査強化であり、Git tag/release、AWS deploy/publish、CloudFormation capture、final checklist signoff は実行しない。
