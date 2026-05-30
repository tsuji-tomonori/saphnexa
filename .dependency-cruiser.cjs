module.exports = {
  forbidden: [
    {
      name: "ui-not-to-apps",
      from: { path: "^packages/ui" },
      to: { path: "^apps/" },
      severity: "error"
    },
    {
      name: "domain-not-to-ui",
      from: { path: "^packages/domain" },
      to: { path: "^packages/ui|^apps/" },
      severity: "error"
    },
    {
      name: "db-schema-not-to-web",
      from: { path: "^packages/(db-schema|db-types)" },
      to: { path: "^apps/web|^packages/ui" },
      severity: "error"
    },
    {
      name: "web-not-to-server",
      from: { path: "^apps/web" },
      to: { path: "^apps/(api|agent|tools-api)|^infra" },
      severity: "error"
    }
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true
  }
};
