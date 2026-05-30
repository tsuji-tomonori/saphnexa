import { assert, listFiles, readText } from "./lib.js";

const allowed = new Set(["tools/check-secret-patterns.js"]);
const patterns = [
  /AKIA[0-9A-Z]{16}/,
  /aws_secret_access_key\s*=\s*['"][^'"]+['"]/i,
  /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /sk-[A-Za-z0-9]{20,}/
];

for (const file of listFiles(["apps", "infra", "packages", "tools", "docs", ".github"], (path) => /\.(ts|tsx|js|mjs|json|md|yml|yaml|toml)$/.test(path))) {
  if (allowed.has(file)) continue;
  const body = readText(file);
  for (const pattern of patterns) assert(!pattern.test(body), `${file} contains a secret-like token matching ${pattern}`);
}

console.log("secret pattern check passed");
