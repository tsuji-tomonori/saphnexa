import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function readText(path) {
  return readFileSync(path, "utf8");
}

export function listFiles(roots, predicate = () => true) {
  const files = [];
  for (const root of roots) walk(root, files, predicate);
  return files.sort();
}

function walk(path, files, predicate) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    if ([".git", "node_modules", ".worktrees", "dist", "build", "coverage"].includes(path.split("/").at(-1))) return;
    for (const entry of readdirSync(path)) walk(join(path, entry), files, predicate);
    return;
  }
  if (predicate(path)) files.push(path);
}

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}
