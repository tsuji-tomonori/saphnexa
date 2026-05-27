import { assert, listFiles, readText } from "./lib.js";

const requiredRunbooks = [
  "docs/ops/runbooks/incident-response.md",
  "docs/ops/runbooks/reingestion.md",
  "docs/ops/runbooks/evaluation-rerun.md",
  "docs/ops/runbooks/rollback.md",
  "docs/ops/runbooks/user-import-failure.md",
  "docs/ops/runbooks/access-change.md",
  "docs/ops/runbooks/backup-restore.md"
];

for (const file of requiredRunbooks) {
  const body = readText(file);
  for (const heading of ["## 目的", "## 前提", "## 手順", "## 検証", "## 証跡"]) {
    assert(body.includes(heading), `${file} missing ${heading}`);
  }
}

const localVerification = readText("docs/ops/local-verification.md");
for (const command of ["npm run admin-artifacts:build", "npm run artifacts:check"]) {
  assert(localVerification.includes(command), `local verification docs missing ${command}`);
}

for (const file of listFiles(["docs"], (path) => path.endsWith(".md"))) {
  const body = readText(file);
  assert(!/[ \t]$/m.test(body), `${file} has trailing whitespace`);
}

console.log("docs check passed");
