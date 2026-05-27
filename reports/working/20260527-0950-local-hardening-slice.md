# 作業完了レポート

保存先: `reports/working/20260527-0950-local-hardening-slice.md`

## 1. 受けた指示

- Saphnexa 基本設計 v0.16 と検収 package v1.0 を満たすまで実装を継続する。
- ローカル確認は `.workspace/local.md` を参考にし、AWS 実体が必要な項目は未実施として残す。
- 実施していない検証を実施済みとして書かない。

## 2. 要件整理

| 要件ID | 指示・要件 | 重要度 | 対応状況 |
|---|---|---:|---|
| R1 | CSRF runtime guard を追加する | 高 | 対応 |
| R2 | ws-ticket negative を検証する | 高 | 対応 |
| R3 | prompt injection refusal を検証する | 高 | 対応 |
| R4 | ingestion 冪等/失敗/再実行可能状態を検証する | 高 | 対応 |
| R5 | pairwise/perf/cost/storage metadata 検査を追加する | 高 | 対応 |
| R6 | AWS 実体の未検証は残す | 高 | 対応 |

## 3. 検討・判断したこと

- local API に実際の CSRF guard を入れ、テストも `/api/me` 相当の `getMe` から token を取得して状態変更 API に渡す形へ変更した。
- ws-ticket は AppSync 実接続ではなく、ticket 発行・消費の不変条件を store で検証した。
- prompt injection は benchmark 固有値ではなく、system/tool/ACL 制約変更を求める入力を refusal に分類し、tool 呼び出しへ進まないことを検証した。
- storage check は OpenSearch 非依存を code/infra/package に限定し、traceability 上の説明文は検出対象外にした。

## 4. 実施した作業

- `apps/api/src/local-api.js` に CSRF guard を追加した。
- `packages/domain/src/store.js` に ws-ticket、ingestion metadata validation、retry、idempotency、admin event を追加した。
- `packages/rag-core/src/fixture-rag.js` に prompt injection refusal を追加した。
- `packages/testing/src/pairwise.js`、cost estimate、pairwise/perf/cost/storage 検査 scripts を追加した。
- `tests/integration-local.test.js` と `tests/e2e-local.test.js` を CSRF ありの経路へ更新し、negative tests を追加した。
- `docs/acceptance/traceability.md` を更新した。

## 5. 成果物

| 成果物 | 形式 | 内容 | 指示との対応 |
|---|---|---|---|
| `apps/api/src/local-api.js` | JS | CSRF runtime guard | AC-033 |
| `packages/domain/src/store.js` | JS | ws-ticket、ingestion hardening | AC-045/101/103/104 |
| `packages/rag-core/src/fixture-rag.js` | JS | prompt injection refusal | AC-099 |
| `packages/testing/src/pairwise.js` | JS | 15 pairwise cases | AC-124 |
| `tools/check-*.js` | JS | pairwise/perf/cost/storage checks | AC-084/131/140/141 |
| `tests/integration-local.test.js` | JS test | security/ingestion negative tests | AC-033/045/099/103/104 |

## 6. 指示へのfit評価

| 評価軸 | 評価 | 理由 |
|---|---:|---|
| 指示網羅性 | 4 | 未実装だった複数の P0/P1/P2 local invariant を検証可能にした。 |
| 制約遵守 | 4 | AWS 実体未検証を trace/report に残した。 |
| 成果物品質 | 4 | runtime guard と negative test を追加し、verify に組み込んだ。 |
| 説明責任 | 4 | false positive 修正と未検証範囲を記録した。 |
| 検収容易性 | 4 | pairwise/perf/cost/storage の専用 check を追加した。 |

総合fit: 4.0 / 5.0（約80%）
理由: ローカルで検証できる security/quality invariant は前進したが、AWS 実体、ブラウザ E2E、Allure/Docusaurus、実 cost/inventory 証跡が未完了。

## 7. 実行した検証

- `npm test`: pass
- `npm run verify`: pass
- `npm run pairwise:check`: pass
- `npm run perf:local`: pass
- `npm run cost:check`: pass
- `npm run storage:check`: fail -> 修正後 pass
- `git diff --check`: pass

## 8. 未対応・制約・リスク

- CSRF は local API guard であり、Cognito/CloudFront/API Gateway cookie 属性の実検証は未実施。
- ws-ticket は local store 消費検証であり、AppSync Events の onSubscribe 実検証は未実施。
- prompt injection は local representative case であり、20件 attack test と AgentCore trace は未実施。
- cost estimate は local planning estimate であり、AWS Pricing Calculator / Cost Explorer 証跡ではない。
