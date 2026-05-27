# 評価再実行 runbook

## 目的

RAG 品質ゲート、LLM judge、retrieval/generation/end-to-end 指標を再計測し、検収または回帰調査に使える評価証跡を作る。

## 前提

- 対象 dataset、model、prompt version、retrieval config、commit SHA が確定していること。
- 評価 artifacts bucket と Allure/評価 report の公開先が利用できること。

## 手順

1. `evaluation_datasets` と評価ケース件数を確認する。
2. 評価 run を作成し、状態が `queued` になったことを確認する。
3. worker 実行後、`evaluation_runs` と `evaluation_run_items` の完了状態を確認する。
4. retrieval、generation、end-to-end の各 metrics を保存する。
5. report URL を evidence manifest と acceptance checklist に反映する。

## 検証

- `recall@10 >= 0.85`、`citation precision >= 0.90`、`groundedness >= 0.90`、`refusal accuracy >= 0.95`、`unsupported claim rate <= 0.02` を満たすこと。
- 失敗ケースがある場合は case ID、質問、根拠、判定理由を残すこと。

## 証跡

- evaluation run ID、dataset version、metrics JSON、report URL、Allure link、commit SHA、実行日を保存する。
