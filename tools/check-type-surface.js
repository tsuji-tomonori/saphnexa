import { assert, listFiles, readJson, readText } from "./lib.js";

const packageFiles = listFiles(["apps", "infra", "packages"], (path) => path.endsWith("package.json"));
for (const file of packageFiles) {
  const pkg = readJson(file);
  assert(pkg.name?.startsWith("@saphnexa/") || pkg.name === "saphnexa", `${file} has invalid package name`);
  assert(pkg.type === "module", `${file} must use ESM type=module`);
}

for (const file of listFiles(["packages/api-contract", "packages/tool-contract", "packages/domain"], (path) => path.endsWith(".js"))) {
  const body = readText(file);
  assert(body.includes("export "), `${file} must export its public surface`);
}

for (const [pkgFile, script] of [
  ["apps/api/package.json", "typecheck"],
  ["apps/agent/package.json", "typecheck"],
  ["apps/tools-api/package.json", "typecheck"],
  ["apps/web/package.json", "typecheck"],
  ["packages/ui/package.json", "typecheck"]
]) {
  const pkg = readJson(pkgFile);
  assert(pkg.scripts?.[script]?.includes("tsc --noEmit --project tsconfig.json"), `${pkgFile} must define TypeScript typecheck script`);
}

for (const file of [
  "apps/api/src/app.ts",
  "apps/agent/src/app.ts",
  "apps/tools-api/src/app.ts",
  "apps/web/src/pages/ChatPage.tsx",
  "apps/web/src/pages/AdminDashboardPage.tsx",
  "packages/ui/src/templates/AppShell.tsx"
]) {
  const body = readText(file);
  assert(body.includes("export "), `${file} must export its TypeScript public surface`);
}

console.log("type surface check passed");
