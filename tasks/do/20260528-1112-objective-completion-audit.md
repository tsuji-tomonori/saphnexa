# Objective 全体監査と PR 本文更新

状態: in_progress

## 背景

ユーザー依頼の objective は、基本設計 v0.17 package をもとに 1〜6 を進め、7「AWS dev/UAT E2E・性能・RAG品質検証」ができる状態へ進めることである。PR #2 には各 slice の実装 commit と PR コメントが積まれているが、PR 本文は初期 preflight の説明に留まり、現在の全体 scope を表していない。

## 目的

現在の branch/PR の現物に基づき objective 1〜7 の監査を行い、実装済み・未実施・外部実行待ちを明確にする。あわせて PR 本文を最新 scope に更新し、レビューと次の AWS 実行に使える状態にする。

## タスク種別

ドキュメント更新

## スコープ

- 現在の branch、PR、作業レポート、検証結果、script/docs の状態を確認する。
- 1〜7 の item ごとに、証明できる成果物と未実施の実 AWS 作業を整理した作業レポートを追加する。
- PR #2 のタイトル/本文を現在の累積変更に合わせて更新する。
- 実 AWS deploy / publish / E2E / 負荷試験 / RAG 品質評価は実施しない。

## 実施計画

1. 現行 branch/PR/証跡を確認する。
2. objective 全体監査レポートを `reports/working/` に追加する。
3. PR 本文を日本語で最新 scope に更新する。
4. docs/report の軽量検証を行う。
5. commit/push、PR コメント、task done 移動まで行う。

## ドキュメント保守計画

- 監査結果は一時作業レポートとして `reports/working/` に残す。
- durable docs は前タスクまでに更新済みのため、監査で不足が見つかった場合のみ更新する。

## 受け入れ条件

- [ ] objective 1〜7 について、現行 branch の証跡に基づく監査レポートが存在する。
- [ ] 実 AWS 未実施事項を完了済みとして書かず、次に必要な final evidence を明記する。
- [ ] PR #2 のタイトル/本文が、現在の累積変更と検証結果を反映している。
- [ ] `git diff --check` と必要な docs/report 検査が pass する。
- [ ] PR に監査結果とセルフレビューコメントを追加できる。

## 検証計画

- `git diff --check`
- `npm run docs:check`
- `npm run acceptance:package:check`
- `gh pr view 2 --json title,body`

## PR レビュー観点

- 監査が実際の current state に基づいていること。
- 実 AWS 未実施項目と fixture/local verified の境界が曖昧になっていないこと。
- PR 本文が実施済み検証だけを記載していること。

## リスク

- 実 AWS 証跡がないため、objective の「AWS dev/UAT 検証完了」までは証明できない。
- このタスクは reviewability と completion audit の改善であり、外部環境の最終 PASS には別途 AWS 実行が必要である。
