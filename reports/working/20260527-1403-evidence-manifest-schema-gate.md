# evidence manifest schema gate 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/local.md` をもとに、検収受入条件 package を満たすまで実装・検証を継続する。
- 外部状態変更は確認なしに実行せず、未実施項目を完了扱いしない。

## 要件整理

- AC-001/AC-002 は最終 `evidence_manifest.json` に commit/tag/AWS account/CloudFormation/test report/docs/RAG/cost の実証跡を記録することを要求している。
- `.workspace/Saphnexa_証跡マニフェスト_schema_v1.0.json` は worktree 外にあるため、schema snapshot と source checksum をリポジトリ内で検査可能にする必要がある。
- example manifest は placeholder を含むため、final acceptance proof として扱わないことを checker で明示する必要がある。

## 検討・判断

- `docs/acceptance/evidence/evidence_manifest.schema.json` を `.workspace` schema の nested properties まで同期し、`x_source` metadata と SHA-256 を追加した。
- `tools/check-evidence-manifest.js` は schema required/nested property/source checksum と、example が `example_not_for_acceptance` であることを検査する形に強化した。
- final candidate validator は引き続き placeholder final manifest を拒否し、最終実証跡が未配置なら `not_ready` として扱う。

## 実施作業

- evidence manifest schema に source package/file/checksum/target design metadata を追加。
- `test_reports`、`docs_site`、`rag_evaluation` の nested properties を schema に追加。
- example manifest に `example_status=example_not_for_acceptance` を追加。
- `tools/check-evidence-manifest.js` で source checksum、schema required、nested properties、example placeholder、final limitation note を検査。

## 成果物

- `docs/acceptance/evidence/evidence_manifest.schema.json`
- `docs/acceptance/evidence/evidence_manifest.example.json`
- `tools/check-evidence-manifest.js`
- `tasks/done/20260527-1400-evidence-manifest-schema-gate.md`

## 検証

- `npm run evidence:check`: pass
- `npm run acceptance:final-candidate:check`: pass (`not_ready` expected)
- `npm run acceptance:final:build`: pass
- `npm run acceptance:final:check`: pass
- `npm run acceptance:package:build`: pass
- `npm run acceptance:package:check`: pass
- `npm run docs:check`: pass
- `npm run ci:check`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files ...`: pass
- PR #1 GitHub Actions: run `26494028041` / `26494029821` の 14 jobs が pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4551540890
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4551844342
- task 完了更新セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4551850957

## Fit 評価

- AC-001/AC-002 の最終 evidence manifest 形式を source schema と同期し、example を final proof と誤認しない gate を追加したため、検収 package の監査性が向上した。
- 実 release/AWS/publish/signoff は実行していないため、最終検収完了ではなく final evidence 提出前の schema gate 強化として partial progress。

## 未対応・制約・リスク

- AC-001/002/004/081/150/151/152 は引き続き `requires_aws`。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence 作成、checklist signoff は未実行。
- `.workspace` の evidence schema が更新された場合、schema snapshot と checksum の再同期が必要。
- レポート更新 commit 後の GitHub Actions は別途確認する。
