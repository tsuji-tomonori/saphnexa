# CI typecheck dependency install

- 状態: done
- タスク種別: 修正
- 作成日時: 2026-05-29 09:35 JST
- 対象ブランチ: `codex/typescript-framework-implementation`
- 対象 PR: https://github.com/tsuji-tomonori/saphnexa/pull/3

## 背景

PR #3 の CI `typecheck` job が clean checkout で失敗した。ローカルでは `npm install` 済みの `node_modules` があり `npm run typecheck` は pass していたが、GitHub Actions の `typecheck` job は依存 install なしで `npm run typecheck` を実行していた。

## 問題文

2026-05-29 の PR #3 CI において、`typecheck` job が `hono`、`zod`、`react`、workspace package などを解決できず失敗した。

## なぜなぜ分析

- 確認済み事実:
  - `gh pr checks 3` で `typecheck` が fail。
  - `gh run view 26610710030 --job 78415769661 --log` で `Cannot find module 'hono'` など依存未解決 error を確認。
  - `.github/workflows/ci.yml` の `typecheck` job は checkout と setup-node の後に `npm run typecheck` だけを実行している。
  - 今回の変更で `npm run typecheck` は実 `tsc` を実行し、npm dependencies と workspace package links を必要とする。
- 推定原因:
  - CI job が依存 install を前提にしていなかったため、lockfile 追加後も clean runner に `node_modules` が存在しない。
- 根本原因:
  - `typecheck` job の手順が、実 TypeScript compilation に必要な npm workspace dependency resolution を含んでいない。
- 影響範囲:
  - GitHub Actions の `typecheck` job。既存の Node script だけで完結する他 job は今回の失敗ログでは未影響。
- 対策:
  - `typecheck` job に `npm ci` を追加し、`package-lock.json` に基づく依存解決後に `npm run typecheck` を実行する。

## 受け入れ条件

- [x] `.github/workflows/ci.yml` の `typecheck` job が `npm ci` を実行してから `npm run typecheck` を実行する。
- [x] ローカル `npm run typecheck` が pass する。
- [x] `.github/workflows/ci.yml` の YAML 検査または関連 docs check が pass する。
- [x] PR に CI 修正のセルフレビューを追記する。

## 検証計画

- `npm run typecheck`
- `npm run docs:check`
- `git diff --check`
- `gh pr checks 3`

## 検証結果

- `npm ci`: pass。
- `npm run typecheck`: pass。
- `npm run docs:check`: pass。
- `git diff --check`: pass。
- commit hook `check yaml`: pass。

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4569446557
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/3#issuecomment-4569447425

## リスク

- `npm ci` により typecheck job の実行時間は増える。
- CI 上の registry/network 障害が typecheck job の新しい外部依存になる。
