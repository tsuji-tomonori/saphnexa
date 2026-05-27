# finalization command defect refresh 作業完了レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と検収受入条件 package v1.0 の充足に向けて、完了条件を満たすまでローカルで進める。
- 実施していない外部作業は実施済みとして扱わない。
- task md、作業レポート、検証、commit / PR コメントの workflow を守る。

## 要件整理

- AC-153 の defect snapshot refresh は final readiness の最終化手順にも出す必要がある。
- `gh issue list --state open --json number,title,labels,state` は final manifest/checklist build より前に案内する。
- checker で command set と order を検査する。
- 外部 action は未実行 / pending のまま維持する。

## 検討・判断

- runbook と external action plan は既に defect snapshot refresh を含むため、追加 docs 更新は不要と判断した。
- final readiness の `finalization_commands` は最終検収前の command sequence として使われるため、fresh defect snapshot の再取得 command を明示する必要がある。
- 実際の `gh issue list` 実行は外部状態確認であり、この作業では行わなかった。

## 実施作業

- `tools/final-acceptance-readiness.js` の `finalization_commands` に `gh issue list --state open --json number,title,labels,state` を追加した。
- `tools/check-final-acceptance-readiness.js` の expected command list に同 command を追加した。
- defect snapshot refresh command が `acceptance:final-manifest:build` と `acceptance:final-checklist:build` より前に並ぶことを検査する order check を追加した。
- task md を `tasks/do/20260528-0050-finalization-command-defect-refresh.md` に作成・更新した。

## 成果物

- `tools/final-acceptance-readiness.js`
- `tools/check-final-acceptance-readiness.js`
- `tasks/do/20260528-0050-finalization-command-defect-refresh.md`

## 検証

- pass: `npm run acceptance:final:check`
- pass: `npm run acceptance:package:check`
- pass: `npm run verify`
- pass: `git diff --check`

## fit 評価

- 指示への fit: 高い。AC-153 の最終再取得 gate を final readiness の command sequence に反映し、検収手順の抜けを減らした。
- Completion Discipline: 現時点では実装・検証まで完了。PR コメント、task done 移動、追加 commit / push は後続で実施する。
- PR self review 観点: RAG の根拠性・認可境界は変更していない。benchmark 期待語句、QA sample 固有値、dataset 固有分岐は追加していない。

## 未対応・制約・リスク

- GitHub issue tracker の最終再取得、Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final checklist signoff は未実行。
- 最終 readiness は引き続き外部作業待ちであり、最終検収完了とは扱えない。
- `finalization_commands` は外部確認 command を案内するが、この commit 自体は外部 action を実行しない。
