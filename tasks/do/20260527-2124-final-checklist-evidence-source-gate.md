# final checklist evidence source gate

- 状態: do
- タスク種別: 機能追加
- 対象ブランチ: `codex/saphnexa-acceptance-impl`
- 対象PR: `#1`

## 背景

final acceptance の候補検査では、最終 checklist の `証跡リンク` が URL として成立していること、かつ localhost/private IP などの非公開ホストではないことを検査している。一方で、公開 URL であっても Saphnexa の最終 evidence manifest や当該 GitHub repository と無関係な外部 URL を checklist 証跡として混入させた場合に、証跡の出所を十分に縛れない余地がある。

## 目的

final checklist の各 `証跡リンク` が、最終 evidence manifest に列挙された artifact 配置先、または manifest の GitHub release と同じ repository の GitHub 証跡を指すことを検査し、無関係な公開 URL を最終証跡として扱わない。

## スコープ

- `tools/final-evidence-candidate.js` の final checklist 検査を強化する。
- `tools/check-final-evidence-candidate-fixtures.js` に無関係な公開 URL を拒否する fixture を追加する。
- 必要に応じて evidence manifest schema / docs の説明に検査観点を反映する。

## スコープ外

- Git tag/release の作成
- AWS deploy/publish
- CloudFormation capture
- final evidence manifest / final checklist の実作成または署名

## 受け入れ条件

- [ ] final checklist の `証跡リンク` が URL として有効でも、manifest artifact 配置先または当該 GitHub repository の証跡でない場合は `acceptance:final-candidate:fixture:check` が失敗として検出する。
- [ ] 既存の ready fixture は引き続き ready になる。
- [ ] final acceptance の外部残件を完了扱いしない。
- [ ] 変更範囲に見合う検証を実行し、結果を task / report / PR コメントに残す。

## Done 条件

- [ ] 実装と fixture を追加する。
- [ ] 選定した検証コマンドが pass する。
- [ ] 作業レポートを `reports/working/` に作成する。
- [ ] commit / push し、PR に受け入れ条件確認コメントとセルフレビューコメントを投稿する。
- [ ] PR コメント後に task を `tasks/done/` へ移動し、その更新も commit / push する。

## 実装計画

1. final candidate checklist 検査に evidence source allowlist を追加する。
2. manifest artifact URL と GitHub release repository をもとに、checklist evidence URL の出所を判定する。
3. 無関係な公開 URL fixture を追加し、検査ラベルを明示する。
4. target check と package/final readiness check を実行する。

## ドキュメント保守方針

final evidence manifest schema そのものの required field は変更しない。検査観点の説明更新が必要な場合のみ、schema description または作業レポートに反映する。

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

- checklist evidence source を厳しくしすぎると、最終検収時の正当な外部証跡 URL を拒否する可能性がある。そのため、manifest artifact 配置先と current GitHub repository の証跡を許容し、外部 vendor URL は manifest に明示されない限り final checklist 証跡として扱わない。
