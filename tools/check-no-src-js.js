import { assert, listFiles, readJson } from "./lib.js";

const roots = ["apps", "packages"];
const strict = process.argv.includes("--strict");
const allowlist = readJson("tools/source-js-allowlist.json");
const allowed = new Map(allowlist.allowed.map((entry) => [entry.path, entry]));
const sourceJsFiles = listFiles(roots, (path) => /\/src\/.*\.js$/.test(path));

const missingAllowlistEntries = sourceJsFiles.filter((path) => !allowed.has(path));
const staleAllowlistEntries = [...allowed.keys()].filter((path) => !sourceJsFiles.includes(path));

assert(allowlist.policy?.includes("production-ready"), "source JS allowlist policy must state production-ready handling");
assert(missingAllowlistEntries.length === 0, `source JS files missing allowlist entries: ${missingAllowlistEntries.join(", ")}`);
assert(staleAllowlistEntries.length === 0, `source JS allowlist contains stale entries: ${staleAllowlistEntries.join(", ")}`);

for (const path of sourceJsFiles) {
  const entry = allowed.get(path);
  assert(entry.reason && entry.reason.length >= 30, `${path} allowlist reason must explain the transition`);
  assert(/compatibility|fixture|mirror|helper/.test(entry.reason), `${path} allowlist reason must describe why JS remains`);
}

if (strict) {
  assert(sourceJsFiles.length === 0, `production-ready source-of-truth forbids JavaScript under src: ${sourceJsFiles.join(", ")}`);
}

console.log(`source JS check passed (${sourceJsFiles.length} transition allowlist entries)`);
