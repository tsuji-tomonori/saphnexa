---
title: ローカル検証
---

# ローカル検証

公開前の Docusaurus / Allure artifact は repository root で以下を実行して検証する。

```bash
npm run admin-artifacts:build
npm run artifacts:check
npm run admin-artifacts:publish:check
npm run aws:dev-uat:validation:check
npm run aws:dev-uat:validation:fixture:check
```

AWS dev/UAT では `aws-deploy-publish` action の候補コマンドを実行し、CloudFront 配下の docs/Allure URL を final evidence に記録する。
E2E・性能・RAG 品質は `dist/acceptance/aws_dev_uat_validation.json` に実 AWS 証跡を記録し、`test:e2e:aws`、`perf:aws`、`rag:quality:aws` を通す。
