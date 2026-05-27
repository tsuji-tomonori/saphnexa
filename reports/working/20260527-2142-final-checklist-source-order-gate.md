# final checklist source order gate 作業レポート

## 指示・目的

- `Saphnexa_基本設計書_v0.16.md`、`local.md`、検収受入条件 package に沿って、final acceptance に向けた実装とローカル検証を継続する。
- final acceptance の外部残件を完了扱いせず、ローカルで強化できる gate を追加する。
- repo ルールに従い task、検証、commit、PR コメント、作業レポートを残す。

## 要件整理

| 要件ID | 要件 | 対応 |
|---|---|---|
| R1 | final checklist の AC ID 順序が source catalog と一致することを検査する | 対応 |
| R2 | final checklist に重複 ID がないことを検査する | 対応 |
| R3 | ready fixture を壊さない | 対応 |
| R4 | final acceptance の外部残件を完了扱いしない | 対応 |

## 検討・判断

- 既存 validator は全 AC ID の存在と各行内容の一致を確認しているが、行順と ID 一意性は独立した検査ラベルとして明示されていなかった。
- final checklist は検収 package の監査成果物であり、source catalog と同じ順序を保つことでレビュー、差分確認、再生成時の比較が容易になる。
- reviewer や checked date の一律性よりも、source catalog 由来の構造不変条件を検査する方が仕様に沿った低リスクな強化と判断した。

## 実施作業

- `tools/final-evidence-candidate.js`
  - `validateChecklistRowIdentity` を追加した。
  - checklist ID の一意性を `checklist.unique_ids` として検査するようにした。
  - checklist ID 順序が `acceptanceIds` と完全一致することを `checklist.source_order` として検査するようにした。
- `tools/check-final-evidence-candidate-fixtures.js`
  - 先頭2行を入れ替えた `reorderedChecklist` fixture を追加した。
  - ID を重複させた `duplicateChecklistId` fixture を追加した。
- `tasks/do/20260527-2140-final-checklist-source-order-gate.md`
  - 受け入れ条件、Done 条件、検証計画を明記した。

## 実行した検証

- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass。final files 未配置のため status は `not_ready` のまま。
- `npm run acceptance:package:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files tools/check-final-evidence-candidate-fixtures.js tools/final-evidence-candidate.js tasks/do/20260527-2140-final-checklist-source-order-gate.md`: pass

## 成果物

| 成果物 | 内容 |
|---|---|
| `tools/final-evidence-candidate.js` | final checklist source order / unique ID gate |
| `tools/check-final-evidence-candidate-fixtures.js` | 順序入れ替え・重複 ID 拒否 fixture |
| `tasks/do/20260527-2140-final-checklist-source-order-gate.md` | task 管理 |
| `reports/working/20260527-2142-final-checklist-source-order-gate.md` | 本レポート |

## Fit 評価

総合fit: 4.6 / 5.0

理由: final checklist の監査性を高める row order / unique ID gate を追加し、targeted check と `npm run verify` まで pass した。一方で、final acceptance 自体は Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final checklist signoff が未完了のため、完了扱いにはできない。

## 未対応・制約・リスク

- 未対応: Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence manifest/checklist 作成、検収者 signoff。
- 制約: 外部状態を変更する操作はユーザー確認が必要なため未実施。
- リスク: 最終 checklist を手編集する場合、source catalog と行順がずれると validator が拒否する。提出前に source catalog 順で再整列する必要がある。
