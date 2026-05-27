import { buildFinalEvidenceCandidateStatus, finalCandidateStatusPath } from "./final-evidence-candidate.js";

const status = buildFinalEvidenceCandidateStatus();
if (status.ready) {
  console.log(`final evidence candidate check passed: ${finalCandidateStatusPath}`);
} else {
  console.log(`final evidence candidate not ready: ${finalCandidateStatusPath}`);
  if (status.errors.length > 0) {
    for (const error of status.errors) console.log(`- ${error}`);
    process.exitCode = 1;
  }
}
