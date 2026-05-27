# final checklist evidence source gate 作業レポート

## 指示・目的

- `Saphnexa_基本設計書_v0.16.md`、`local.md`、検収受入条件 package に沿って、final acceptance に向けたローカル実装・検証を継続する。
- final acceptance の完了条件を満たしていない外部残件は完了扱いしない。
- repo ルールに従い task、検証、commit、PR コメント、作業レポートを残す。

## 要件整理

| 要件ID | 要件 | 対応 |
|---|---|---|
| R1 | final checklist の証跡リンクが無関係な公開 URL でも通らないようにする | 対応 |
| R2 | ready fixture を壊さない | 対応 |
| R3 | 外部残件を完了扱いしない | 対応 |
| R4 | 変更範囲に見合う検証を実行する | 対応 |

## 検討・判断

- `証跡リンク` は既に URL 形式と非公開ホストを検査しているため、今回は出所の整合性を追加した。
- 証跡の許可元は、最終 evidence manifest に列挙された artifact 配置先と、manifest の GitHub release URL から特定できる current repository の GitHub 証跡に限定した。
- final evidence manifest / final checklist / CloudFormation inventory の実ファイル作成、Git tag/release、AWS deploy/publish は外部実行と確認が必要なため、未完了のまま扱った。

## 実施作業

- `tools/final-evidence-candidate.js`
  - final checklist 検査に `証跡リンク_known_source` を追加した。
  - GitHub 証跡は manifest の release repository と同じ repository の URL のみ許容するようにした。
  - manifest の test report / docs / RAG evaluation artifact と同じ S3 bucket または HTTPS host の証跡を許容するようにした。
- `tools/check-final-evidence-candidate-fixtures.js`
  - 無関係な公開 URL を checklist 証跡に設定した fixture を追加し、`証跡リンク_known_source` で拒否されることを確認した。
- `tasks/do/20260527-2124-final-checklist-evidence-source-gate.md`
  - 受け入れ条件、Done 条件、検証計画を明記した。

## 実行した検証

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass。final files 未配置のため status は `not_ready` のまま。
- `npm run acceptance:package:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files tools/check-final-evidence-candidate-fixtures.js tools/final-evidence-candidate.js tasks/do/20260527-2124-final-checklist-evidence-source-gate.md`: pass

## 成果物

| 成果物 | 内容 |
|---|---|
| `tools/final-evidence-candidate.js` | final checklist evidence source gate |
| `tools/check-final-evidence-candidate-fixtures.js` | 無関係な公開 URL 拒否 fixture |
| `tasks/do/20260527-2124-final-checklist-evidence-source-gate.md` | task 管理 |
| `reports/working/20260527-2126-final-checklist-evidence-source-gate.md` | 本レポート |

## Fit 評価

総合fit: 4.6 / 5.0

理由: ローカルで追加可能な final checklist 証跡の出所検査を実装し、targeted check と `npm run verify` まで pass した。一方で、final acceptance 自体は Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final checklist signoff が未完了のため、完了扱いにはできない。

## 未対応・制約・リスク

- 未対応: Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence manifest/checklist 作成、検収者 signoff。
- 制約: 外部状態を変更する操作はユーザー確認が必要なため未実施。
- リスク: 最終検収時に third-party の証跡 URL を使う必要がある場合は、manifest artifact として明示する運用に寄せる必要がある。
