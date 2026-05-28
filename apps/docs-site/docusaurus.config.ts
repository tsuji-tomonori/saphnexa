import type { Config } from "@docusaurus/types";
import type { Preset } from "@docusaurus/preset-classic";

const baseUrl = process.env.SAPHNEXA_DOCS_BASE_URL ?? "/admin/docs/latest/";

const config: Config = {
  title: "Saphnexa",
  tagline: "管理者向け設計書サイト",
  favicon: "img/favicon.ico",
  url: process.env.SAPHNEXA_DOCS_SITE_URL ?? "https://docs.saphnexa.invalid",
  baseUrl,
  trailingSlash: true,
  organizationName: "tsuji-tomonori",
  projectName: "saphnexa",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  i18n: {
    defaultLocale: "ja",
    locales: ["ja"]
  },
  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts"
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css"
        }
      } satisfies Preset.Options
    ]
  ],
  themeConfig: {
    navbar: {
      title: "Saphnexa",
      items: [{ type: "docSidebar", sidebarId: "docs", position: "left", label: "設計書" }]
    }
  } satisfies Preset.ThemeConfig
};

export default config;
