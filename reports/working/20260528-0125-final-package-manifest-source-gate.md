# final package manifest source gate

## 受けた指示

- 検収 package v1.0 が満たされるまで、外部 state 変更を伴わないローカル作業を継続する。
- 実行していない外部 action や検証を完了扱いしない。

## 要件整理

- final-ready package では `evidence_manifest.json` が提出対象であり、draft/pending marker を含む manifest を final として扱ってはいけない。
- local preflight では従来通り `evidence_manifest.draft.json` を生成し、外部 action pending を維持する必要がある。

## 検討・判断

- `dist/acceptance/summary.json` に実際に検査すべき `evidence_manifest_path` を記録する方針にした。
- final-ready 時だけ `docs/acceptance/final/evidence_manifest.json` を `dist/acceptance/evidence_manifest.json` として package に含める。
- checker は summary の manifest path を読み、draft / final の検査を分岐する。

## 実施作業

- `tools/build-acceptance-package.js` で final-ready 時の final manifest 出力と summary path 記録を追加した。
- `tools/check-acceptance-package.js` で final manifest path、draft marker 非存在、pending final evidence 非存在、GitHub release URL と tag の整合を検査する分岐を追加した。
- `docs/ops/runbooks/final-acceptance.md` に local preflight と final-ready package の manifest path 差分を追記した。

## 成果物

- local preflight: `dist/acceptance/evidence_manifest.draft.json`
- final-ready package: `dist/acceptance/evidence_manifest.json`
- summary field: `dist/acceptance/summary.json#evidence_manifest_path`

## 検証

- pass: `npm run acceptance:package:check`
- pass: `npm run acceptance:final:check`
- pass: `npm run docs:check`
- pass: `npm run verify`

## fit 評価

- final-ready state で draft/pending manifest を主 evidence として扱う余地を閉じ、検収 package の提出物 semantics を明確化した。
- local preflight では引き続き external action pending と draft manifest を維持している。

## 未対応・制約・リスク

- GitHub issue tracker 再取得、Git tag/release、AWS deploy/publish、CloudFormation capture、final evidence candidate、final signoff は未実行。
- final-ready branch は実 final evidence ファイルがないため、現在のローカル run では pending branch の実行確認と checker 分岐の静的検査に留まる。
