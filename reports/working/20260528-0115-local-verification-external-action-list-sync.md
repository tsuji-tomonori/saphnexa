# local verification external action list sync 作業完了レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と検収受入条件 package v1.0 の充足に向けて、完了条件を満たすまでローカルで進める。
- 実施していない外部作業は実施済みとして扱わない。
- task md、作業レポート、検証、commit / PR コメントの workflow を守る。

## 要件整理

- local verification docs の「ローカルでは完了扱いにしないこと」一覧を最新の external action set と同期する。
- defect snapshot refresh を外部 action plan 実行対象として明示する。
- docs checker で同期漏れを検出する。

## 検討・判断

- local verification docs には GitHub issue tracker の最終再取得行は追加済みだったが、外部 action plan の要約行には defect snapshot refresh が抜けていた。
- 未実施外部作業の一覧は final readiness の誤読防止に関わるため、docs checker でも phrase を固定して検査することにした。

## 実施作業

- `docs/ops/local-verification.md` の外部 action plan 実行一覧に `defect snapshot refresh` を追加した。
- `tools/check-docs.js` に `CloudFormation capture、defect snapshot refresh、final evidence 作成` の記載検査を追加した。
- task md を `tasks/do/20260528-0115-local-verification-external-action-list-sync.md` に作成・更新した。

## 成果物

- `docs/ops/local-verification.md`
- `tools/check-docs.js`
- `tasks/do/20260528-0115-local-verification-external-action-list-sync.md`

## 検証

- pass: `npm run docs:check`
- pass: `npm run verify`

## fit 評価

- 指示への fit: 高い。未実施外部作業の一覧を最新の external action plan に同期し、検収完了の誤判定を避ける説明を強化した。
- Completion Discipline: 現時点では実装・検証まで完了。PR コメント、task done 移動、追加 commit / push は後続で実施する。
- PR self review 観点: docs と checker の同期のみ。RAG の根拠性・認可境界は変更していない。benchmark 期待語句、QA sample 固有値、dataset 固有分岐は追加していない。

## 未対応・制約・リスク

- GitHub issue tracker の最終再取得、Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final checklist signoff は未実行。
- 最終 readiness は引き続き外部作業待ちであり、最終検収完了とは扱えない。
- docs checker が特定 phrase に依存するため、今後 wording を変える場合は checker も同期する必要がある。
