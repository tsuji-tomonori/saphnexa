# Domain TypeScript source 作業レポート

## 指示

- `.workspace` の基本設計と `plan-20260529.txt` をもとに、TypeScript framework implementation の未達項目を継続して進める。
- 作業前に `main` を pull/fetch してから進める。
- repository local workflow に従い、task md、検証、PR コメント、作業レポートを残す。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | `origin/main` を取得し、作業ブランチが main を取り込んでいることを確認する | 対応 |
| R2 | `packages/domain` の typed source を追加し、plan の `packages/domain/**/*.ts` 方針へ近づける | 対応 |
| R3 | JS runtime mirror と TS source の主要 token 同期を source gate で確認する | 対応 |
| R4 | 実 DSQL/Cognito/AppSync 接続を完了扱いにしない | 対応 |
| R5 | 変更範囲に見合う検証を実行し、未実施検証を実施済みとして書かない | 対応 |

## 検討・判断

- 既存 local tools/tests は `.js` runtime mirror を使っているため、今回は runtime 置換ではなく typed source と source gate の追加に限定した。
- `packages/domain/src/index.ts` では role/status/event 名と権限 helper を typed source として定義し、`canReadChat` / `canWriteChat` / `canManageAdmin` の contract を緩和しない方針にした。
- `packages/domain/src/observability.ts` では log schema、metric、alarm、retention catalog を typed source として定義し、既存 observability check の対象 token と同期させた。
- `packages/domain/src/store-types.ts` では local store state と主要 method/RAG adapter 境界を型定義し、本番 DB 接続が完了したような表現は避けた。

## 実施作業

- `packages/domain/src/index.ts` を追加し、role/status/event/helper/error response contract を export。
- `packages/domain/src/observability.ts` を追加し、log/metric/alarm/retention catalog と validation helper を export。
- `packages/domain/src/store-types.ts` を追加し、local domain state、chat/run/event/citation/admin artifact/tool invocation、`LocalStore`、`RagAdapter` 境界を export。
- `packages/domain/tsconfig.json` と `tsconfig.typecheck.json` に TS source を含めた。
- `tools/check-type-surface.js` に Domain TS source と JS runtime mirror の主要 token 同期検査を追加。
- `docs/ops/local-verification.md` に Domain TS source gate と未完了扱いの範囲を追記。
- `tasks/do/20260529-1020-domain-ts-source.md` に受け入れ条件と検証結果を記録。

## 成果物

| 成果物 | 内容 |
|---|---|
| `packages/domain/src/index.ts` | Domain role/status/event/helper typed source |
| `packages/domain/src/observability.ts` | Observability catalog typed source |
| `packages/domain/src/store-types.ts` | Local store/RAG adapter typed boundary |
| `tools/check-type-surface.js` | Domain TS/JS mirror gate |
| `docs/ops/local-verification.md` | local verification docs 更新 |
| `tasks/do/20260529-1020-domain-ts-source.md` | task 記録 |

## 実行した検証

- `npm run typecheck`: pass
- `npm run typecheck -w @saphnexa/domain`: pass
- `npm run test:contract`: pass
- `npm test`: pass。15 tests。
- `npm run docs:check`: pass
- `git diff --check`: pass

## fit 評価

総合fit: 4.4 / 5.0（約88%）

理由: plan の `packages/domain/**/*.ts` 方針に対し、公開 contract、observability、local store 境界を typed source として追加し、source gate と実 `tsc` で検証できる状態にした。一方で、runtime は引き続き `.js` mirror であり、`.ts` からの runtime artifact 生成や実 DSQL/Cognito/AppSync 接続は未対応のため満点ではない。

## 未対応・制約・リスク

- `packages/domain/src/store.js` の runtime 実装そのものは TS へ置換していない。
- `.ts` source から runtime artifact を生成して local tools/tests を動かす構成は未対応。
- 実 DSQL/Cognito/AppSync 接続、DB 生成型、AWS runtime 検証は別 slice の対象。
