# final evidence manifest builder strict input 作業レポート

## 受けた指示

- `.workspace/Saphnexa_基本設計書_v0.16.md` と検収受入条件 package v1.0 を満たすまで実装・検証を継続する。
- repository rule に従い、task、検証、作業レポート、commit / PR コメントまで行う。

## 要件整理

- final evidence manifest builder は final candidate gate より緩い入力を受け付けないこと。
- GitHub release URL と tag、Allure/docs/RAG artifact path、cost usage basis を生成前に検査すること。
- 外部 Git release / AWS publish / final signoff は本タスクで完了扱いしないこと。

## 検討・判断

- final candidate validator と evidence manifest schema は既に artifact path 契約を持っているため、docs 追加ではなく builder の入力検査を同じ観点へ寄せる方針にした。
- final manifest 生成後にだけ不整合が分かる状態を避けるため、builder の fixture に invalid input ケースを追加した。
- RAG 実装、API route、認証・認可、dataset 固有ロジックには触れない範囲に限定した。

## 実施作業

- `tools/final-evidence-manifest.js` に `github_release_url` と `git_tag` の一致検査を追加した。
- test report URL が Allure latest / runs path に一致することを builder で検査するようにした。
- docs URL が `/admin/docs/latest/`、`/admin/docs/versions/v0.16/`、`docs-site/latest/`、`docs-site/releases/v0.16/` に合うことを検査するようにした。
- RAG evaluation report URL が `evaluation_run_id` と一致する path を指すことを検査するようにした。
- cost assumption が `50 DAU` と `10 questions/user/day` を含むことを検査するようにした。
- `tools/check-final-evidence-manifest-fixtures.js` に release URL/tag mismatch、Allure latest mismatch、docs path mismatch、RAG report mismatch、cost usage basis mismatch の invalid fixture を追加した。

## 成果物

- `tools/final-evidence-manifest.js`
- `tools/check-final-evidence-manifest-fixtures.js`
- `tasks/do/20260527-2354-final-manifest-builder-strict-input.md`

## 検証

- pass: `npm run acceptance:final-manifest:fixture:check`
- pass: `npm run acceptance:final-candidate:fixture:check`
- pass: `npm run docs:check`
- pass: `npm run acceptance:final:check`
- pass: `npm run acceptance:package:check`
- pass: `npm run verify`
- pass: `git diff --check`
- pass: `pre-commit run --files tools/final-evidence-manifest.js tools/check-final-evidence-manifest-fixtures.js tasks/do/20260527-2354-final-manifest-builder-strict-input.md reports/working/20260527-2357-final-manifest-builder-strict-input.md`

## fit 評価

- task の受け入れ条件は実装・fixture・verify の範囲で満たした。
- final acceptance 自体は外部 action 未実施のため未完了。`final_acceptance_ready` は false のまま維持する。

## 未対応・制約・リスク

- Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final checklist signoff は未実施。
- builder validation が厳しくなったため、不完全な UAT input JSON は生成前に fail する。これは final gate と同じ契約へ早期に寄せる意図した挙動。
