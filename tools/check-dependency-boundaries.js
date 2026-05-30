import { assert, listFiles, readText } from "./lib.js";

const rules = [
  { root: "packages/ui", forbidden: ["apps/"], reason: "packages/ui must not depend on apps" },
  { root: "packages/domain", forbidden: ["packages/ui", "apps/"], reason: "packages/domain must remain UI/app independent" },
  { root: "packages/db-schema", forbidden: ["apps/web", "packages/ui"], reason: "db-schema must not depend on UI/web" },
  { root: "packages/db-types", forbidden: ["apps/web", "packages/ui"], reason: "db-types must not depend on UI/web" },
  { root: "apps/web", forbidden: ["apps/api", "apps/agent", "apps/tools-api", "infra"], reason: "web must not import server/infra code" },
  { root: "apps/api", forbidden: ["apps/web", "infra"], reason: "api must not import web/infra code" },
  { root: "apps/agent", forbidden: ["apps/web", "apps/api", "infra"], reason: "agent must not import web/api/infra code" }
];

for (const rule of rules) {
  for (const file of listFiles([rule.root], (path) => /\.(ts|tsx|js|mjs)$/.test(path))) {
    const body = readText(file);
    for (const forbidden of rule.forbidden) {
      assert(!body.includes(`from "../${forbidden}`) && !body.includes(`from "../../${forbidden}`) && !body.includes(`from "${forbidden}`), `${file}: ${rule.reason}: ${forbidden}`);
    }
  }
}

console.log("dependency boundary check passed");
