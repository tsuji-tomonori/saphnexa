# edge/realtime/security 静的検収スライス 作業レポート

## 受けた指示

- 検収受入条件 package v1.0 の充足へ向け、ローカルで実装・検証を継続する。
- task md、検証、PR コメント、作業レポートを残す。
- AWS 実リソース、IAM policy simulator、cdk-nag 実行、AppSync Events 実接続を実施済みとして書かない。

## 要件整理

| 要件ID | 要件 | 対応状況 |
|---|---|---|
| R1 | edge route / CloudFront Function intent を検査する | 対応 |
| R2 | realtime ws-ticket channel scope intent を検査する | 対応 |
| R3 | WAF/IAM/KMS/SQS/DLQ/cdk-nag intent を検査する | 対応 |
| R4 | CI、Taskfile、admin report、docs、trace を同期する | 対応 |
| R5 | AWS 実体未検証の制約を明示する | 対応 |

## 検討・判断の要約

- 実 AWS リソースがないため、construct metadata に intent catalog を追加し、`edge:security:check` で必須 intent を静的検査する形にした。
- WebSocket は local ws-ticket の TTL、single-use、user-scoped channel を実行検査し、AppSync Events 実接続は未実施として残した。
- IAM/KMS/SQS/DLQ/cdk-nag は設計 intent と baseline の検査に留め、実 policy 評価や cdk-nag 実行と区別した。

## 実施作業

- EdgeStaticConstruct に CloudFront Function routing / OAC / signed cookie / WAF intent を追加。
- RealtimeConstruct に ws-ticket channel policy intent を追加。
- DataConstruct に KMS/SSE-KMS/public access deny intent を追加。
- RagProcessingConstruct に queue/DLQ intent を追加。
- ObservabilityCicdConstruct と security baseline に IAM/cdk-nag/SQS/DLQ intent を追加。
- `tools/check-edge-security-intent.js` を追加し、`package.json`、Taskfile、CI、admin test report、docs/trace を同期。

## 成果物

| 成果物 | 内容 |
|---|---|
| `tools/check-edge-security-intent.js` | edge/realtime/security/IaC intent の静的検査 |
| `infra/constructs/*` | edge routing、channel、KMS、queue、IAM review intent |
| `docs/acceptance/traceability.md` | AC-035/036/044/047/048/082/083/085/086 の根拠更新 |
| `docs/ops/local-verification.md` | 新規 `edge:security:check` と未実施制約を追記 |

## 実行した検証

- `npm run edge:security:check`: pass
- `npm run cdk:synth:local`: pass
- `npm run security:scan`: pass
- `npm run ci:check`: pass
- `npm run docs:check`: pass
- `npm run acceptance:check`: pass
- `npm run admin-artifacts:build`: pass
- `npm run artifacts:check`: pass
- `npm test`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files ...`: pass

## Fit 評価

総合fit: 4.4 / 5.0（約88%）

ローカルで静的検査可能な IaC intent は追加できた。実 CloudFront Function、WAF/IAM/KMS/SQS/DLQ、AppSync Events、cdk-nag 実行は未検証のため満点ではない。

## 未対応・制約・リスク

- AWS deployed resource、IAM policy simulator、KMS key policy、SQS/DLQ 実体、AppSync Events 実接続、cdk-nag 実行は未検証。
- intent catalog は設計・実装予定の静的根拠であり、deploy 後の構成 drift 検出の代替ではない。
- PR #1 の最新 GitHub Actions 結果は push 後に確認する。
