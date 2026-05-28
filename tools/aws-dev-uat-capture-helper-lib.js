import { writeSync } from "node:fs";

export function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    if (key === "help") {
      args.help = true;
      continue;
    }
    args[key] = argv[index + 1];
    index += 1;
  }
  return args;
}

export function printHelp({ script, env }) {
  const lines = [
    `Usage: node tools/${script} --env <dev|uat> --run-id <run-id>`,
    "",
    "Required environment variables:",
    ...env.map((name) => `- ${name}`),
    ""
  ];
  writeSync(1, lines.join("\n"));
}

export function requireEnvironment(args) {
  assert(["dev", "uat"].includes(args.env), "--env must be dev or uat");
  assert(typeof args["run-id"] === "string" && args["run-id"].trim().length > 0, "--run-id is required");
  assertNoPlaceholder(args["run-id"], "--run-id");
  return {
    environment: args.env,
    run_id: args["run-id"]
  };
}

export function requiredEnv(names) {
  return Object.fromEntries(names.map((name) => [name, requiredEnvValue(name)]));
}

export function optionalEnv(name) {
  const value = process.env[name];
  if (!value) return null;
  assertNoPlaceholder(value, name);
  return value;
}

export function requiredHttpsUrl(value, label) {
  assertNoPlaceholder(value, label);
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }
  assert(url.protocol === "https:", `${label} must use https`);
  assertPublicHostname(url.hostname, label);
  return url.toString();
}

export function requiredWssUrl(value, label) {
  assertNoPlaceholder(value, label);
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }
  assert(url.protocol === "wss:", `${label} must use wss`);
  assertPublicHostname(url.hostname, label);
  return url.toString();
}

export function assertNoPlaceholder(value, label) {
  assert(typeof value === "string" && value.trim().length > 0, `${label} is required`);
  assert(!/(^|[-_:/\s])(placeholder|pending|todo|tbd|dummy|mock|fixture|example|localhost|127\.0\.0\.1|0\.0\.0\.0)([-_:/\s]|$)/i.test(value), `${label} must not be placeholder/local text`);
}

export async function probeUrl(url, options = {}) {
  const headers = options.cookie ? { cookie: options.cookie } : {};
  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(options.timeoutMs || 10000)
  });
  return {
    url,
    status: response.status,
    ok: response.status >= 200 && response.status < 500,
    redirected: response.status >= 300 && response.status < 400,
    content_type: response.headers.get("content-type")
  };
}

export function writeCapture(data) {
  writeSync(1, `${JSON.stringify(data, null, 2)}\n`);
}

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function requiredEnvValue(name) {
  const value = process.env[name];
  assertNoPlaceholder(value, name);
  return value;
}

function assertPublicHostname(hostname, label) {
  assert(!hostname.endsWith(".local") && !hostname.endsWith(".test") && !hostname.endsWith(".internal"), `${label} must not use local/internal hostname`);
  assert(!/^10\./.test(hostname) && !/^192\.168\./.test(hostname) && !/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname), `${label} must not use private IP hostname`);
}
