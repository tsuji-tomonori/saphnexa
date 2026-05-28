---
title: ローカル検証
---

# ローカル検証

公開前の Docusaurus / Allure artifact は repository root で以下を実行して検証する。

```bash
npm run admin-artifacts:build
npm run artifacts:check
npm run admin-artifacts:publish:check
```

AWS dev/UAT では `aws-deploy-publish` action の候補コマンドを実行し、CloudFront 配下の docs/Allure URL を final evidence に記録する。
