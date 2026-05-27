# final manifest release url schema gate 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と `.workspace/local.md` をもとに、検収受入条件 package を満たすまで実装・検証を継続する。
- 未実施の外部検証や署名を完了扱いしない。

## 要件整理

- `.workspace` の evidence manifest schema は `github_release_url` を source required に含めない。
- AC-001 と final candidate validator では GitHub release URL が最終証跡として必要である。
- source schema の required list と checksum を維持しつつ、final acceptance 追加要件として GitHub release URL を明示する必要がある。

## 検討・判断

- schema の source required list は変更せず、`x_final_acceptance_extension.required` で `github_release_url` を追加必須として表現した。
- `github_release_url` property と example placeholder を追加し、checker で final extension と example の非 final marker を検査した。
- final candidate validator は既に GitHub release URL を検査しているため、schema/example/checker 側を合わせた。

## 実施作業

- `docs/acceptance/evidence/evidence_manifest.schema.json` に `github_release_url` property と `x_final_acceptance_extension` を追加。
- `docs/acceptance/evidence/evidence_manifest.example.json` に non-final GitHub release URL を追加。
- `tools/check-evidence-manifest.js` で source required と final extension required を分けて検査。
- `tasks/done/20260527-1620-final-manifest-release-url-schema-gate.md` を作成し、完了状態へ更新。
- PR へ受け入れ条件確認コメントとセルフレビューコメントを追加。

## 成果物

- final acceptance extension 付き evidence manifest schema
- GitHub release URL placeholder を含む example manifest
- final extension を検査する `npm run evidence:check`

## 検証

- `npm run evidence:check`: pass
- `npm run acceptance:final-candidate:fixture:check`: pass
- `npm run acceptance:final-candidate:check`: pass (`not_ready` expected)
- `npm run verify`: pass
- `git diff --check`: pass
- `pre-commit run --files docs/acceptance/evidence/evidence_manifest.schema.json docs/acceptance/evidence/evidence_manifest.example.json reports/working/20260527-1625-final-manifest-release-url-schema-gate.md tasks/do/20260527-1620-final-manifest-release-url-schema-gate.md tools/check-evidence-manifest.js`: pass
- `pre-commit run --files reports/working/20260527-1625-final-manifest-release-url-schema-gate.md tasks/done/20260527-1620-final-manifest-release-url-schema-gate.md`: pass

## PR コメント

- 受け入れ条件確認: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552378753
- セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552381204
- task 完了更新セルフレビュー: https://github.com/tsuji-tomonori/saphnexa/pull/1#issuecomment-4552433542

## GitHub Actions

- 最新 push `44a3c0e` 後の PR checks: pass
- Run: `26497214486`, `26497216243`
- 対象 job: lint / typecheck / unit / integration / e2e / security scan / license scan / cdk synth / cdk diff / contract generation diff / db observability / admin offline restore / admin artifacts / quality gates

## Fit 評価

- AC-001 の GitHub release URL 証跡が schema/example/checker/final validator の全てで明示され、final evidence manifest の提出要件がより明確になった。
- GitHub release は未作成のため、AC-001 の final PASS ではなく final evidence schema の整合性強化として partial progress。

## 未対応・制約・リスク

- AC-001/002/004/081/150/151/152 は引き続き `requires_aws`。
- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence 作成、checklist signoff は未実行。
- GitHub Actions の最新実行結果は push 後に確認する。
