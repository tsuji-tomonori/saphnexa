import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    "overview",
    {
      type: "category",
      label: "運用",
      items: ["operations/local-verification"]
    }
  ]
};

export default sidebars;
