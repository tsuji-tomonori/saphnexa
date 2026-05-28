import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { performance } from "node:perf_hooks";
import { createLocalApi } from "../apps/api/src/local-api.js";
import { assert, readText } from "./lib.js";

const api = createLocalApi();
const routesSource = readText("apps/web/src/routes.ts");
const chatSource = readText("apps/web/src/chat/ChatApp.tsx");
const chatPageSource = readText("apps/web/src/pages/ChatPage.tsx");
const chatNavSource = readText("apps/web/src/features/chat/ChatSessionNav.tsx");
const composerSource = readText("apps/web/src/features/chat/MessageComposer.tsx");
const eventsPanelSource = readText("apps/web/src/features/chat/MessageEventsPanel.tsx");
const adminSource = readText("apps/web/src/admin/AdminApp.tsx");
const adminPageSource = readText("apps/web/src/pages/AdminDashboardPage.tsx");
const adminActionsSource = readText("apps/web/src/features/admin/AdminActions.tsx");
const artifactTableSource = readText("apps/web/src/features/admin/ArtifactTable.tsx");
const assistantRuntimeSource = readText("apps/web/src/lib/assistantRuntime.ts");
const meHookSource = readText("apps/web/src/hooks/useMe.ts");
const chatSessionsHookSource = readText("apps/web/src/hooks/useChatSessions.ts");
const artifactsHookSource = readText("apps/web/src/hooks/useAdminArtifacts.ts");
const startEvaluationHookSource = readText("apps/web/src/hooks/useStartEvaluationRun.ts");

const scenarios = [];
scenario("route role metadata", () => {
  for (const [path, role] of [
    ["/chat", "general_user"],
    ["/admin", "admin"],
    ["/admin/docs/latest/", "admin"],
    ["/admin/docs/versions/v0.17/", "admin"],
    ["/admin/test-reports/allure/latest/", "admin"]
  ]) {
    assert(routesSource.includes(`path: "${path}"`), `route missing: ${path}`);
    assert(new RegExp(`path: "${escapeRegex(path)}".+role: "${role}"`).test(routesSource), `route role mismatch: ${path}`);
  }
});

scenario("chat UI source contract", () => {
  for (const token of [
    "QueryClientProvider",
    "ChatPage"
  ]) {
    assert(chatSource.includes(token), `ChatApp missing token: ${token}`);
  }
  for (const token of [
    "useChatSessions",
    "useMessageEvents",
    "createSaphnexaAssistantAdapter",
    "setMessageId(accepted.message_id)"
  ]) {
    assert(chatPageSource.includes(token), `ChatPage missing token: ${token}`);
  }
  assert(meHookSource.includes("/api/me"), "useMe hook must call /api/me");
  assert(chatSessionsHookSource.includes("/api/chat-sessions"), "useChatSessions hook must call /api/chat-sessions");
  for (const token of [
    "aria-label=\"チャット一覧\"",
    "role=\"status\"",
    "チャットはありません"
  ]) {
    assert(chatNavSource.includes(token), `ChatSessionNav missing token: ${token}`);
  }
  for (const token of [
    "aria-label=\"質問\"",
    "disabled={!props.csrfToken || !props.question}"
  ]) {
    assert(composerSource.includes(token), `MessageComposer missing token: ${token}`);
  }
  for (const token of [
    "aria-label=\"イベント\"",
    "role=\"status\"",
    "イベントはありません"
  ]) {
    assert(eventsPanelSource.includes(token), `MessageEventsPanel missing token: ${token}`);
  }
  for (const token of [
    "@assistant-ui/react",
    "/api/chat-sessions/",
    "/messages"
  ]) {
    assert(assistantRuntimeSource.includes(token), `assistant runtime missing token: ${token}`);
  }
  assert(!/useState<Chat\[\]>\(\[[^\]]/.test(chatPageSource), "ChatPage must not seed fake chats");
  assert(!/useState<EventRow\[\]>\(\[[^\]]/.test(chatPageSource), "ChatPage must not seed fake events");
});

scenario("chat local API flow", () => {
  const csrf = api.request("user-owner", "getMe").body.csrf_token;
  const chat = api.request("user-owner", "createChatSession", { csrf_token: csrf, title: "flow chat" });
  assert(chat.status === 201, "chat creation failed");
  const submit = api.request("user-owner", "submitQuestion", {
    csrf_token: csrf,
    chat_id: chat.body.chat.chat_id,
    question: "Saphnexa は何をするシステムか",
    retrieval_policy: { top_k: 10, allowed_acl_scope_ids: ["user:user-owner"] }
  });
  assert(submit.status === 202, "chat submit failed");
  const events = api.request("user-owner", "listMessageEvents", { chat_id: chat.body.chat.chat_id, message_id: submit.body.message_id });
  assert(events.status === 200, "chat events fetch failed");
  assert(events.body.events.some((event) => event.event_name === "chat.message.final_ready"), "final event missing");
});

scenario("admin UI source contract", () => {
  for (const token of [
    "AdminDashboardPage"
  ]) {
    assert(adminSource.includes(token), `AdminApp missing token: ${token}`);
  }
  for (const token of [
    "useAdminArtifacts",
    "aria-label=\"成果物\""
  ]) {
    assert(adminPageSource.includes(token), `AdminDashboardPage missing token: ${token}`);
  }
  assert(meHookSource.includes("/api/me"), "useMe hook must call /api/me");
  assert(artifactsHookSource.includes("/api/admin/artifacts"), "useAdminArtifacts hook must call /api/admin/artifacts");
  for (const token of [
    "aria-label=\"管理操作\"",
    "role=\"status\"",
    "disabled={!props.csrfToken || !datasetId}",
    "setJobStatus(response.evaluation_run.status)"
  ]) {
    assert(adminActionsSource.includes(token), `AdminActions missing token: ${token}`);
  }
  assert(startEvaluationHookSource.includes("/api/admin/evaluation-runs"), "useStartEvaluationRun hook must call /api/admin/evaluation-runs");
  for (const token of [
    "DataTable",
    "Drawer",
    "成果物はありません",
    "href={artifact.viewer_path}",
    "{artifact.title}"
  ]) {
    assert(artifactTableSource.includes(token), `ArtifactTable missing token: ${token}`);
  }
  assert(!adminActionsSource.includes("dataset-local-golden"), "Admin UI must not hard-code dataset ids");
  assert(!/useState<Artifact\[\]>\(\[[^\]]/.test(adminPageSource), "AdminApp must not seed fake artifacts");
});

scenario("admin local API flow", () => {
  const csrf = api.request("admin-1", "getMe").body.csrf_token;
  assert(api.request("user-owner", "listPublishedArtifacts").status === 403, "general user must not list admin artifacts");
  const artifacts = api.request("admin-1", "listPublishedArtifacts");
  assert(artifacts.status === 200, "admin artifacts list failed");
  assert(artifacts.body.artifacts.length >= 3, "admin artifacts missing");
  const evaluation = api.request("admin-1", "startEvaluationRun", { csrf_token: csrf, dataset_id: "dataset-local-golden" });
  assert(evaluation.status === 202, "evaluation run failed");
  const cookie = api.request("admin-1", "issueArtifactAccessCookie", { csrf_token: csrf });
  assert(cookie.status === 201, "artifact cookie failed");
});

const report = {
  schema_version: "web-flow-local.v1",
  generated_by: "tools/check-web-flows.js",
  scenarios,
  passed: scenarios.filter((item) => item.status === "passed").length,
  failed: scenarios.filter((item) => item.status === "failed").length,
  note: "Node/local API/source gate によるローカル flow 検査。実ブラウザ/CloudFront E2E の証跡ではない。"
};
write("dist/reports/web-flow-local.json", `${JSON.stringify(report, null, 2)}\n`);
assert(report.failed === 0, "web flow scenarios failed");
console.log(`web flow check passed (${report.passed}/${scenarios.length} scenarios)`);

function scenario(name, fn) {
  const started = performance.now();
  try {
    fn();
    scenarios.push({ name, status: "passed", duration_ms: Number((performance.now() - started).toFixed(3)) });
  } catch (error) {
    scenarios.push({ name, status: "failed", duration_ms: Number((performance.now() - started).toFixed(3)), error: error.message });
  }
}

function write(path, body) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
