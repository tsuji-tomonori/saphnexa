# local verification defect refresh doc sync 作業完了レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と検収受入条件 package v1.0 の充足に向けて、完了条件を満たすまでローカルで進める。
- 実施していない外部作業は実施済みとして扱わない。
- task md、作業レポート、検証、commit / PR コメントの workflow を守る。

## 要件整理

- local verification docs は最新の external action set と同期する必要がある。
- `defect-snapshot-refresh` と `gh issue list --state open --json number,title,labels,state` を明示する。
- GitHub issue tracker の最終再取得を、ローカル snapshot だけで完了扱いにしない。
- docs checker で記載漏れを検出する。

## 検討・判断

- AC-153 gate は実装済みだが、local verification docs の外部 action 一覧が古かった。
- docs checker に command presence だけでなく defect refresh の phrase 検査を追加し、今後の同期漏れを検出する方針にした。
- GitHub issue tracker の再取得は外部確認であり、この作業では実行しなかった。

## 実施作業

- `docs/ops/local-verification.md` の external action 説明に `defect-snapshot-refresh` を追加した。
- 同 docs に `gh issue list --state open --json number,title,labels,state` と、ローカル snapshot だけでは完了扱いにしない旨を追加した。
- `tools/check-docs.js` に defect refresh 関連 phrase の検査を追加した。
- task md を `tasks/do/20260528-0058-local-verification-defect-refresh-doc-sync.md` に作成・更新した。

## 成果物

- `docs/ops/local-verification.md`
- `tools/check-docs.js`
- `tasks/do/20260528-0058-local-verification-defect-refresh-doc-sync.md`

## 検証

- pass: `npm run docs:check`
- pass: `npm run acceptance:external-actions:check`
- pass: `npm run acceptance:final:check`
- pass: `npm run verify`
- pass: `git diff --check`

## fit 評価

- 指示への fit: 高い。AC-153 の外部再取得 gate を local verification docs と docs checker に同期し、未実施外部確認を実施済みにしない説明を強化した。
- Completion Discipline: 現時点では実装・検証まで完了。PR コメント、task done 移動、追加 commit / push は後続で実施する。
- PR self review 観点: docs と実装の同期を改善した。RAG の根拠性・認可境界は変更していない。benchmark 期待語句、QA sample 固有値、dataset 固有分岐は追加していない。

## 未対応・制約・リスク

- GitHub issue tracker の最終再取得、Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final checklist signoff は未実行。
- 最終 readiness は引き続き外部作業待ちであり、最終検収完了とは扱えない。
- docs checker が特定 phrase を検査するため、今後 docs wording を変える場合は checker も同期する必要がある。
