# final readiness check freshness 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/local.md` をもとに、検収受入条件 package を満たすまで実装・検証を継続する。
- 未実施の外部検証や署名を完了扱いしない。

## 要件整理

- `acceptance:final:check` は final readiness を検査するが、従来は既存 `dist/acceptance/final_readiness.json` を読むだけだった。
- schema や gate 変更後に build を忘れると、古い readiness を検査して false failure / false confidence が起きうる。
- package check と同様に、check 実行時に生成物の freshness を保証する必要がある。

## 検討・判断

- `acceptance:final:check` が `acceptance:final:build` を内包するようにし、単独実行でも最新 readiness を検査できるようにした。
- final acceptance runbook の明示手順は維持し、local verification docs には check が再生成してから検査することを追記した。
- `verify` では `acceptance:final:build` と check 内の build が重複するが、生成は軽量であり freshness を優先した。

## 実施作業

- `package.json` の `acceptance:final:check` を `npm run acceptance:final:build && node tools/check-final-acceptance-readiness.js` に変更。
- `docs/ops/local-verification.md` に final readiness check が再生成してから検査することを追記。
- `tasks/do/20260527-1658-final-readiness-check-freshness.md` を作成し、なぜなぜ分析、受け入れ条件、検証計画を記録。

## 成果物

- self-refreshing な `npm run acceptance:final:check`
- final readiness freshness を明記した local verification docs

## 検証

- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run ci:check`: pass
- `npm run verify`: pass

## Fit 評価

- final readiness check が stale `dist` に依存しなくなり、AC-001/002/004/081/150/151/152 の pending 状態を最新生成物で確認できるようになった。
- 外部操作は未実施のまま pending として扱っており、最終 PASS は偽装していない。

## 未対応・制約・リスク

- AC-001/002/004/081/150/151/152 は引き続き `requires_aws`。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence 作成、checklist signoff は未実行。
- GitHub Actions の最新実行結果は push 後に確認する。
