# Chat favorite boundary 作業完了レポート

## 受けた指示

- `.workspace` の基本設計と `plan-20260529.txt` に基づき Saphnexa 実装を進める。
- main を pull/fetch してから作業する。
- repository workflow に従い、task md、検証、作業レポート、PR 更新まで行う。

## 要件整理

- FR-FAV-001 のうち、参加チャットをお気に入り登録、一覧、解除できる最小境界を実装する。
- Web は route helper と generated operation helper を使い、固定 favorite や fake count を表示しない。
- local store/API は参加チャットだけ登録でき、本人の favorite だけ削除できる。
- DSQL query plan と DB metadata/shared type が `favorites` table を扱える。
- 実ブラウザ E2E、回答単位の詳細 UX、実 Aurora DSQL 実行は今回の完了範囲に含めない。

## 検討・判断

- 既存 API contract には `listFavorites` / `addFavorite` / `deleteFavorite` があるため、contract 追加ではなく Web hook、local API、DSQL、DB metadata/type の接続を優先した。
- Web UI は現在チャット単位の登録/解除に絞り、回答単位の `message_id` UI は未実装範囲として docs と task に明記した。
- DSQL insert は API body にない `favorite_id` を受け取らず、DB 側の `gen_random_uuid()` で生成する形にした。

## 実施作業

- `favorites` と `message_feedback` の table metadata / DB row type を追加した。
- `packages/domain` local store に `FavoriteRecord`、`addFavorite` の chat 境界、`deleteFavorite`、`listFavorites` 型境界を追加した。
- `apps/api/src/local-api.js` に `deleteFavorite` の local dispatch を追加した。
- DSQL repository に `listFavorites` / `addFavorite` / `deleteFavorite` query plan を追加した。
- Web に `useFavorites` / `useAddFavorite` / `useDeleteFavorite` と `FavoritePanel` を追加し、`ChatPage` へ接続した。
- `tools/check-type-surface.js`、`tools/check-web-flows.js`、`tools/check-ui-quality.js`、`tools/check-web-accessibility-report.js` を更新した。
- `docs/ops/local-verification.md` に Chat favorite の local/source gate と未完了範囲を追記した。

## 成果物

- `apps/web/src/hooks/useFavorites.ts`
- `apps/web/src/features/chat/FavoritePanel.tsx`
- `apps/web/src/pages/ChatPage.tsx`
- `apps/api/src/local-api.js`
- `apps/api/src/repositories/dsql/apiRepository.ts`
- `packages/domain/src/store.js`
- `packages/domain/src/store-types.ts`
- `packages/db-schema/src/table-metadata.ts`
- `packages/db-types/src/index.ts`
- source/docs gate 更新一式

## 検証

- `npm run typecheck -w @saphnexa/db-types`: pass
- `npm run typecheck -w @saphnexa/api`: pass
- `npm run typecheck -w @saphnexa/web`: pass
- `npm run typecheck:source`: pass
- `npm run web:flow:check`: pass
- `npm run ui:check`: pass
- `npm run web:a11y:check`: pass
- `npm run api-client:operation-types:check`: pass
- `npm run docs:check`: pass
- `npm run web:build:check`: pass。Vite の 500 kB chunk warning は出たが、local build output gate は gzip 145995 bytes で pass。
- `npm run test:integration:local`: pass
- `npm run test:contract`: pass
- `npm test`: pass
- `git diff --check`: pass

## fit 評価

- 指示された基本設計の Chat favorite 境界を、既存 contract を活かして local/source gate で検査できる形まで進めた。
- main fetch 後の専用 worktree 上で作業し、元 worktree の未コミット変更は混ぜていない。
- 実施していない実ブラウザ E2E、実 Aurora DSQL、回答単位詳細 UX は完了扱いにしていない。

## 未対応・制約・リスク

- 回答単位のお気に入り UI、重複排除 UX、実ブラウザ操作証跡は未実装。
- DSQL SQL は query plan/source gate までで、実 Aurora DSQL executor による実行確認は未実施。
- CloudFront/Cognito 経由の実 HTTP、CSRF cookie integration、AWS dev/UAT 証跡は未実施。
