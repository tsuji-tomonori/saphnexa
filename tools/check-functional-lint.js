import { assert, listFiles, readText } from "./lib.js";

const classAllow = [/^infra\//, /^packages\/ui\//, /^apps\/web\//, /^apps\/agent\/src\/clients\/toolsApiClient\.ts$/, /^tools\//];

for (const file of listFiles(["apps", "infra", "packages", "tools"], (path) => /\.(ts|tsx|js|mjs)$/.test(path))) {
  const body = readText(file);
  if (!classAllow.some((pattern) => pattern.test(file))) {
    assert(!/\bclass\s+[A-Z]/.test(body), `${file} must not introduce classes outside allowed UI/infra boundaries`);
    assert(!/\bthis\./.test(body), `${file} must not use this outside allowed UI/infra boundaries`);
  }
}

assert(readText("functional-lint.config.json").includes("allowedClassBoundaries"), "functional lint policy config missing allowed class boundaries");
assert(readText("functional-lint.config.json").includes("allowedMutationBoundaries"), "functional lint policy config missing allowed mutation boundaries");

console.log("functional lint policy check passed");
