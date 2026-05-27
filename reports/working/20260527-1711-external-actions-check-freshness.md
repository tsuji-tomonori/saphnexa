# external actions check freshness 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/local.md` をもとに、検収受入条件 package を満たすまで実装・検証を継続する。
- 未実施の外部検証や署名を完了扱いしない。

## 要件整理

- `acceptance:external-actions:check` は外部 action plan を検査するが、従来は既存 `dist/acceptance/external_action_plan.json` を読むだけだった。
- traceability や action 定義の変更後に build を忘れると、古い action plan を検査して false failure / false confidence が起きうる。
- final readiness / package check と同様に、check 実行時に生成物の freshness を保証する必要がある。

## 検討・判断

- `acceptance:external-actions:check` が `acceptance:external-actions:build` を内包するようにし、単独実行でも最新 action plan を検査できるようにした。
- local verification docs には check が action plan を再生成してから検査することを追記した。
- `verify` では `acceptance:external-actions:build` と check 内の build が重複するが、生成は軽量であり freshness を優先した。

## 実施作業

- `package.json` の `acceptance:external-actions:check` を `npm run acceptance:external-actions:build && node tools/check-external-acceptance-actions.js` に変更。
- `docs/ops/local-verification.md` に external action check が再生成してから検査することを追記。
- `tasks/do/20260527-1707-external-actions-check-freshness.md` を作成し、なぜなぜ分析、受け入れ条件、検証計画を記録。

## 成果物

- self-refreshing な `npm run acceptance:external-actions:check`
- external action plan freshness を明記した local verification docs

## 検証

- `npm run acceptance:external-actions:check`: pass
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run ci:check`: pass
- `npm run verify`: pass

## Fit 評価

- external action plan check が stale `dist` に依存しなくなり、AC-001/002/004/081/150/151/152 の外部 pending action を最新 trace で確認できるようになった。
- 外部 action は `requires_confirmation=true` / `external_state_change=true` / `completed=false` のままで、実行済み扱いにはしていない。

## 未対応・制約・リスク

- AC-001/002/004/081/150/151/152 は引き続き `requires_aws`。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence 作成、checklist signoff は未実行。
- GitHub Actions の最新実行結果は push 後に確認する。
