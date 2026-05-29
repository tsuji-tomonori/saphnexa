import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { assert, readJson, readText } from "./lib.js";

const rootPackage = readJson("package.json");
assert(rootPackage.scripts?.["web:build"] === "npm run build -w @saphnexa/web", "web:build script must run the Vite workspace build");

const distDir = "apps/web/dist";
const indexPath = join(distDir, "index.html");
const assetsDir = join(distDir, "assets");

assert(existsSync(indexPath), "Vite build output missing apps/web/dist/index.html");
assert(existsSync(assetsDir), "Vite build output missing apps/web/dist/assets");

const indexHtml = readText(indexPath);
const jsAssets = readdirSync(assetsDir).filter((entry) => entry.endsWith(".js")).sort();
const cssAssets = readdirSync(assetsDir).filter((entry) => entry.endsWith(".css")).sort();
const sourceMaps = readdirSync(assetsDir).filter((entry) => entry.endsWith(".js.map")).sort();

assert(indexHtml.includes("<script") && indexHtml.includes("/assets/"), "index.html must reference built JS assets");
assert(jsAssets.length >= 1, "Vite build must emit at least one JS asset");
assert(indexHtml.includes("<link") && cssAssets.length >= 1, "Vite build must emit and reference vanilla-extract CSS assets");
assert(sourceMaps.length >= jsAssets.length, "Vite build must emit JS sourcemaps");

const gzipLimitBytes = 150 * 1024;
const assets = jsAssets.map((asset) => {
  const path = join(assetsDir, asset);
  const body = readFileSync(path);
  const gzipBytes = gzipSync(body).byteLength;
  assert(gzipBytes <= gzipLimitBytes, `Vite JS asset gzip size exceeds limit: ${asset} ${gzipBytes}`);
  assert(statSync(path).size > 0, `Vite JS asset is empty: ${asset}`);
  return { asset, gzipBytes };
});

console.log(`web build output check passed (${assets.map((item) => `${item.asset}:${item.gzipBytes}`).join(", ")})`);
