# CI typecheck dependency install 作業レポート

## 受けた指示

- main 追従後に `plan-20260529.txt` の TypeScript framework 実装を進める。
- CI 失敗を残したまま完了扱いにしない。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | CI `typecheck` の依存未解決失敗を調査する | 対応 |
| R2 | CI とローカルの dependency install 前提を揃える | 対応 |
| R3 | ローカルで `npm ci` と `npm run typecheck` を確認する | 対応 |
| R4 | PR コメントと task md に結果を残す | 対応予定 |

## 検討・判断の要約

- `gh pr checks 3` で `typecheck` failure を確認し、`gh run view` の log で `hono`、`zod`、`react`、workspace package が解決できていないことを確認した。
- `.github/workflows/ci.yml` の `typecheck` job は `npm run typecheck` の前に install step を持っていなかった。
- 今回の compile gate は npm dependencies を必要とするため、lockfile を使う `npm ci` を `typecheck` job に追加した。
- 他 job は今回の失敗ログ上は依存未解決で失敗していないため、変更は `typecheck` job に限定した。

## 実施作業

- `.github/workflows/ci.yml` の `typecheck` job に `npm ci` を追加した。
- CI と同じ前提確認としてローカルで `npm ci` を実行した。
- `npm ci` 後に `npm run typecheck`、`npm run docs:check`、`git diff --check` を実行した。

## 検証結果

- `npm ci`: pass。audit は 22 vulnerabilities（21 moderate, 1 high）を報告。
- `npm run typecheck`: pass。
- `npm run docs:check`: pass。
- `git diff --check`: pass。

## 成果物

| 成果物 | 内容 |
|---|---|
| `.github/workflows/ci.yml` | `typecheck` job に `npm ci` を追加 |
| `tasks/do/20260529-0935-ci-typecheck-install.md` | CI failure RCA と受け入れ条件 |

## Fit 評価

総合fit: 4.5 / 5.0（約90%）

理由: CI failure の直接原因である dependency install 欠落に対応し、ローカルでは `npm ci` 後の typecheck を確認した。GitHub Actions の再実行結果は push 後に確認するため、現時点では満点ではない。

## 未対応・制約・リスク

- `npm audit fix` は未実施。依存更新の影響範囲が大きいため別 task が適切。
- `typecheck` job は npm registry/network に依存するようになるため、CI 実行時間と外部障害影響は増える。
