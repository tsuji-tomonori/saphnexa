import { assert, readJson, readText } from "./lib.js";

const knip = readJson("knip.json");
assert(Array.isArray(knip.entry) && knip.entry.includes("tools/*.js"), "knip config must include tools entrypoints");
assert(Array.isArray(knip.project) && knip.project.includes("apps/**/*.ts"), "knip config must cover app TypeScript sources");

const packageJson = readJson("package.json");
assert(packageJson.scripts["check:dead"] === "node tools/check-dead-code-config.js", "check:dead script must run repository dead-code gate");
assert(readText("docs/ops/local-verification.md").includes("Knip相当"), "local verification docs must describe Knip-equivalent gate");

console.log("dead-code gate config check passed");
