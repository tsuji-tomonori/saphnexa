# RAG品質・攻撃耐性・timing ローカル検収スライス 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/local.md` を参考に実装し、`.workspace/Saphnexa_検収受入条件_package_v1.0` を満たすまで継続する。
- repository workflow に従い、task md、検証、PR コメント、セルフレビュー、作業レポートを残す。

## 要件整理

- AC-090 は Agent IF contract、AC-095 は参照展開 golden 10、AC-098 は RAG品質 report、AC-099 は attack test 20件、AC-132/133 は RAG timing/load の検査が必要。
- `.workspace/local.md` の方針では、ローカルは fixture retriever/fake LLM/local runner で検証し、Bedrock KB/S3 Vectors/AgentCore 実挙動は AWS dev/UAT で検証する。

## 検討・判断

- 初期 golden dataset と attack dataset を `packages/testing` に置き、local fixture で repeatable に検査する構成にした。
- RAG品質 report は `dist/reports/rag-quality-local.json` に生成し、生成物は commit 対象にしない。
- 実 KB/LLM 品質を証明しないため、trace では Bedrock Evaluations/AgentCore/CloudWatch 実評価を未実施として残した。

## 実施作業

- `packages/testing/src/rag-evaluation.js` に answerable/unanswerable/reference/attack dataset と RAG品質 threshold を追加。
- `tools/check-rag-quality.js` で Agent IF、参照展開 golden、RAG品質 metrics と report 生成を検査。
- `tools/check-rag-security.js` で prompt injection attack 20件の policy violation 0件と tool invocation 0件を検査。
- `tools/check-rag-performance.js` で local RAG 初回通知 p95、最終回答 p95、timeout rate、通知軽量性を検査。
- npm scripts、Taskfile、CI workflow、admin test report suite、CI workflow checker、docs check、local verification docs、acceptance trace を更新。

## 成果物

- `npm run rag:quality:check`
- `npm run rag:security:check`
- `npm run rag:perf:local`
- `dist/reports/rag-quality-local.json` の生成処理
- RAG/Agent 関連 trace の AC-090/095/098/099/132/133 更新

## 指示への fit 評価

- ローカルで検証可能な RAG品質・攻撃・timing gate を CI と `verify` に組み込んだ。
- 実施していない AWS 実 RAG 評価は完了扱いにせず、trace/report に明記した。
- 作業前に task md と Done 条件を明示した。

## 検証

- `npm run rag:quality:check`: pass（recall@10 1.00、citation precision 1.00、groundedness 1.00、refusal accuracy 1.00、unsupported claim rate 0.00、reference expansion 10/10）
- `npm run rag:security:check`: pass（20/20 attacks、policy violations 0）
- `npm run rag:perf:local`: pass（first notification p95 0.568ms、final answer p95 0.568ms、timeout rate 0.00%）
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `npm run acceptance:check`: pass
- `npm run admin-artifacts:build`: pass
- `npm run artifacts:check`: pass
- `npm test`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- PR #1 GitHub Actions `Saphnexa CI`: pass（RAG checks を含む quality gates job を含む 12 jobs）

## 未対応・制約・リスク

- Bedrock KB、S3 Vectors、AgentCore Runtime、Bedrock Evaluations、CloudWatch logs/metrics を使った実 RAG 品質評価は未実施。
- Allure への実 test artifact publish は未実施。
