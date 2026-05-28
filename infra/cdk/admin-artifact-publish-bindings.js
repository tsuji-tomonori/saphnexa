export const adminArtifactPublishBindings = {
  adminArtifactsBucketLogicalId: "AdminArtifactsBucket",
  cloudFront: {
    distributionLogicalId: "SaphnexaDistribution",
    signedCookieRequired: true,
    keyGroupLogicalId: "AdminArtifactsKeyGroup",
    protectedViewerPatterns: ["/admin/docs/*", "/admin/test-reports/*", "/admin/evaluation-reports/*"]
  },
  docusaurus: {
    packageName: "@saphnexa/docs-site",
    packagePath: "apps/docs-site",
    configPath: "apps/docs-site/docusaurus.config.ts",
    sidebarPath: "apps/docs-site/sidebars.ts",
    buildCommand: "npm run build -w @saphnexa/docs-site",
    localArtifactCommand: "npm run docs-site:build",
    latest: docsPublishTarget("latest", "/admin/docs/latest/", "docs-site/latest/", "dist/admin/docs/latest/"),
    versions: [
      docsPublishTarget("v0.16", "/admin/docs/versions/v0.16/", "docs-site/releases/v0.16/", "dist/admin/docs/versions/v0.16/"),
      docsPublishTarget("v0.17", "/admin/docs/versions/v0.17/", "docs-site/releases/v0.17/", "dist/admin/docs/versions/v0.17/")
    ],
    sharedAssets: {
      viewer_path: "/admin/docs/assets/",
      s3_prefix: "docs-site/shared-assets/",
      origin_path_prefix: "/docs-site/shared-assets/"
    }
  },
  allure: {
    generator: "allure-commandline",
    generateCommand: "allure generate dist/allure-results/<test_run_id> --clean -o dist/admin/test-reports/allure/runs/<test_run_id>",
    localArtifactCommand: "npm run allure:generate:local",
    latest: reportPublishTarget("latest", "/admin/test-reports/allure/latest/", "test-reports/allure/latest/", "dist/admin/test-reports/allure/latest/"),
    run: reportPublishTarget("<test_run_id>", "/admin/test-reports/allure/runs/<test_run_id>/", "test-reports/allure/runs/<test_run_id>/", "dist/admin/test-reports/allure/runs/<test_run_id>/"),
    rawResults: {
      s3_prefix_pattern: "test-reports/allure-results/<test_run_id>/",
      local_path_pattern: "dist/allure-results/<test_run_id>/",
      viewer_path: null,
      retention: "short-lived"
    }
  }
};

function docsPublishTarget(version, viewer_path, s3_prefix, local_path) {
  return {
    version,
    viewer_path,
    s3_prefix,
    origin_path_prefix: `/${s3_prefix}`,
    local_path,
    publish_candidate_command: `aws s3 sync ${local_path} s3://<admin-artifacts-bucket>/${s3_prefix}`
  };
}

function reportPublishTarget(label, viewer_path, s3_prefix, local_path) {
  return {
    label,
    viewer_path,
    s3_prefix,
    origin_path_prefix: `/${s3_prefix}`,
    local_path,
    publish_candidate_command: `aws s3 sync ${local_path} s3://<admin-artifacts-bucket>/${s3_prefix}`
  };
}
