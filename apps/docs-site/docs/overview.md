---
title: Saphnexa 基本設計
---

# Saphnexa 基本設計

この Docusaurus site は、Saphnexa の基本設計、ADR、API IF、DB 設計、運用手順を CloudFront の admin-only path で公開するための source である。

公開先:

- latest: `/admin/docs/latest/`
- v0.17: `/admin/docs/versions/v0.17/`

公開成果物は `AdminArtifactsBucket` の `docs-site/` prefix に配置し、CloudFront signed cookie で管理者だけが閲覧できる。
