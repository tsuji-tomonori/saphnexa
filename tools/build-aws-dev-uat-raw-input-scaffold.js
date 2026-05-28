import { buildAwsDevUatRawInputScaffolds } from "./aws-dev-uat-raw-input-scaffold.js";

const environment = process.argv.find((item) => item.startsWith("--env="))?.split("=").at(1);
const result = buildAwsDevUatRawInputScaffolds({ environment });

console.log(`AWS dev/UAT raw input scaffold written: ${result.preflight_path}`);
console.log(`AWS dev/UAT raw input scaffold written: ${result.validation_path}`);
