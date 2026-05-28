# AWS dev/UAT 実行ブリッジ確認

状態: in_progress

## 背景

ユーザー objective は、基本設計 v0.17 package をもとに 1〜6 の本実装を進め、7「AWS dev/UAT E2E・性能・RAG品質検証」ができる状態へ進めることである。現行 PR #2 では source/readiness と final evidence gate が追加済みだが、実 AWS dev/UAT の deploy / migration / publish / E2E / 性能 / RAG品質評価は未実施である。

## 目的

現在の branch で、実 AWS dev/UAT final evidence を作成・検証するための実行ブリッジが十分かを確認する。欠けている repo 内導線があれば追加し、実 AWS 実行に必要な入力、順序、証跡ファイル、final gate を明確にする。

## タスク種別

調査

## スコープ

- 現行 final evidence schema、runbook、npm scripts、Taskfile、external action plan を確認する。
- AWS CLI / 認証 / evidence file の有無を確認し、実行可能性を記録する。
- 実 AWS deploy / migration / publish / 負荷試験 / RAG品質評価の外部実行自体は、認証・環境・費用影響があるため自動実行しない。
- 不足が見つかった場合は、repo 内で安全に追加できる実行ブリッジ、docs、checker、report を追加する。

## 実施計画

1. final evidence と実行 command の current state を確認する。
2. 実 AWS 実行に必要な前提と不足を整理する。
3. repo 内で補える導線を追加または更新する。
4. 関連する targeted checks を実行する。
5. PR コメント、task done、commit/push まで進める。

## ドキュメント保守計画

- 実行手順や不足前提が runbook / local verification とずれていれば更新する。
- 実 AWS 未実施事項は、report と PR コメントで実施済みと誤認されないよう明記する。

## 受け入れ条件

- [ ] AWS dev/UAT final evidence 作成に必要な command、input、artifact path が current state に基づいて整理されている。
- [ ] AWS CLI / 認証 / evidence file の有無を確認し、実 AWS 実行可否を正直に記録している。
- [ ] 不足していた repo 内実行導線があれば補強されている。
- [ ] `git diff --check` と、変更範囲に見合う docs / acceptance check が pass する。
- [ ] PR に受け入れ条件確認とセルフレビューコメントを追加できる。

## 検証計画

- `git diff --check`
- `npm run docs:check`
- `npm run acceptance:package:check`
- 追加・変更した checker / script がある場合はその targeted command

## PR レビュー観点

- 実 AWS 実行を完了済みと誤記していないこと。
- 実行ブリッジが既存 final gate と矛盾しないこと。
- 外部環境・費用・認証が必要な操作を自動実行していないこと。

## リスク

- AWS 認証情報や dev/UAT 環境情報がない場合、実 deploy / migration / publish / E2E / 性能 / RAG品質評価は完了できない。
- 調査で blocker が確認されても、同じ blocker が継続条件を満たすまでは goal 全体を blocked とは扱わない。
