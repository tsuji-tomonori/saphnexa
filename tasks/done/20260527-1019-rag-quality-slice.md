# RAG品質・攻撃耐性・timing ローカル検収スライス

## 背景

- 検収 trace では AC-090/095/098/099/132/133 が未検証または AWS 実評価待ちとして残っている。
- `.workspace/local.md` は RAG/LLM 実サービスをローカルで完全再現せず、fixture retriever / fake LLM / local agent runner によるローカル検証と AWS dev smoke を分ける方針。

## 目的

- 初期 golden dataset による RAG 品質、参照展開、prompt injection 攻撃、RAG timing をローカル・CI で検査できるようにする。
- Bedrock KB / S3 Vectors / AgentCore / CloudWatch を使う実評価は未実施として明確に残す。

## スコープ

- Agent IF の local contract 検査。
- 参照展開 golden 10件中8件以上の検査。
- RAG quality metrics（recall@10、citation precision、groundedness、refusal accuracy、unsupported claim rate）の local report 生成・検査。
- prompt injection attack 20件の policy violation 0件検査。
- RAG 初回通知 p95 <=5s、最終回答 p95 <=60s、timeout rate <2% の local smoke。
- npm scripts、Taskfile、CI workflow、admin report suite、trace、作業レポート更新。

## スコープ外

- Bedrock KB / S3 Vectors / AgentCore Runtime を使った実 RAG 評価。
- CloudWatch logs/metrics による RAG load test。
- Allure への実 test artifact publish。

## タスク種別

機能追加

## チェックリスト

- [x] RAG evaluation fixture dataset を追加する。
- [x] RAG quality checker と local report 生成を追加する。
- [x] prompt injection attack 20 checker を追加する。
- [x] RAG timing/load smoke checker を追加する。
- [x] npm scripts、Taskfile、CI workflow、admin report suite、trace/docs を更新する。
- [x] 検証を実行し、作業レポートを作成する。
- [x] commit/push/PR コメント/セルフレビュー/task done 更新まで完了する。

## Done 条件

- Deliverables:
  - RAG quality / security / perf の検査 script がある。
  - 初期 golden dataset と attack dataset が source 管理されている。
  - RAG quality local report が生成される。
  - `npm run verify` と CI に追加ゲートが組み込まれている。
  - acceptance trace と作業レポートが更新されている。
- Validations:
  - `npm run rag:quality:check` pass
  - `npm run rag:security:check` pass
  - `npm run rag:perf:local` pass
  - `npm test` pass
  - `npm run verify` pass
  - `git diff --check` pass
  - `pre-commit run --files <changed-files>` pass

## 受け入れ条件

- [x] Agent IF は question、actor/user context、retrieval_policy、run/session context を受け、final/refusal/error 形の出力を返すことを検査する。
- [x] 参照展開 golden 10件中8件以上が expanded evidence を得る。
- [x] RAG品質 metrics が recall@10 >=0.85、citation precision >=0.90、groundedness >=0.90、refusal accuracy >=0.95、unsupported claim rate <=0.02 を満たす。
- [x] prompt injection attack 20件で policy violation 0件、tool invocation 0件になる。
- [x] local RAG timing smoke で初回通知 p95 <=5s、最終回答 p95 <=60s、timeout rate <2% を満たす。
- [x] Bedrock KB / S3 Vectors / AgentCore 実評価は未実施として trace/report に明記する。

## 検証計画

- `npm run rag:quality:check`
- `npm run rag:security:check`
- `npm run rag:perf:local`
- `npm test`
- `npm run verify`
- `git diff --check`
- `pre-commit run --files <changed-files>`

## 検証結果

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
- `pre-commit run --files <changed-files>`: pass

## ドキュメント保守方針

- `docs/acceptance/traceability.md` は local fixture と AWS実評価を分けて記載する。
- `docs/ops/local-verification.md` に追加コマンドを反映する。

## PR レビュー観点

- RAG品質 metrics が固定 PASS ではなく local run の結果から算出されていること。
- attack dataset が単一文言の重複ではなく、複数の制約破りパターンを含むこと。
- local fixture の結果を Bedrock/AgentCore 実評価の完了扱いにしていないこと。

## リスク

- local fixture の RAG品質は実 KB/LLM 品質の代替ではないため、最終検収には AWS dev/UAT の RAG evaluation report が必要。

## 状態

done

## PR

- Pull Request: https://github.com/tsuji-tomonori/saphnexa/pull/1
- 受け入れ条件確認コメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550432334
- セルフレビューコメント: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4550433124
- GitHub Apps は既知の `Resource not accessible by integration` のため、`gh` fallback で PR コメントを投稿した。
