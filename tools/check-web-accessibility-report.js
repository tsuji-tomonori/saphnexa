import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { assert, readText } from "./lib.js";

const checks = [];
checkFile("ChatApp", "apps/web/src/chat/ChatApp.tsx", [
  rule("query provider", (body) => body.includes("QueryClientProvider")),
  rule("page wrapper", (body) => body.includes("<ChatPage />"))
]);
checkFile("ChatPage", "apps/web/src/pages/ChatPage.tsx", [
  rule("main landmark", (body) => body.includes("className=\"sx-chat-shell\"")),
  rule("assistant runtime provider boundary", (body) => body.includes("AssistantRuntimeBoundary"))
]);
checkFile("AssistantRuntimeBoundary", "apps/web/src/features/chat/AssistantRuntimeBoundary.tsx", [
  rule("assistant runtime provider", (body) => body.includes("AssistantRuntimeProvider")),
  rule("assistant local runtime", (body) => body.includes("useLocalRuntime")),
  rule("empty token guard", (body) => body.includes("!props.chatId || !props.csrfToken"))
]);
checkFile("ChatSessionNav", "apps/web/src/features/chat/ChatSessionNav.tsx", [
  rule("labelled navigation", (body) => body.includes("<nav aria-label=\"チャット一覧\">")),
  rule("empty chat status", (body) => body.includes("<p role=\"status\">チャットはありません</p>")),
  rule("button type", (body) => !/<button(?![^>]*\stype=)/.test(body))
]);
checkFile("MessageComposer", "apps/web/src/features/chat/MessageComposer.tsx", [
  rule("question label", (body) => body.includes("aria-label=\"質問\"")),
  rule("question disabled state", (body) => body.includes("disabled={!props.csrfToken || !question}")),
  rule("validation error alert", (body) => body.includes("role=\"alert\"")),
  rule("button type", (body) => !/<button(?![^>]*\stype=)/.test(body))
]);
checkFile("CitationDrawerPanel", "apps/web/src/features/chat/CitationDrawerPanel.tsx", [
  rule("citation drawer organism", (body) => body.includes("CitationDrawer")),
  rule("citations from event payload", (body) => body.includes("event.payload_json.citations"))
]);
checkFile("MessageEventsPanel", "apps/web/src/features/chat/MessageEventsPanel.tsx", [
  rule("event panel label", (body) => body.includes("aria-label=\"イベント\"")),
  rule("empty event status", (body) => body.includes("emptyLabel=\"イベントはありません\""))
]);
checkFile("AdminApp", "apps/web/src/admin/AdminApp.tsx", [
  rule("page wrapper", (body) => body.includes("<AdminDashboardPage />"))
]);
checkFile("AdminDashboardPage", "apps/web/src/pages/AdminDashboardPage.tsx", [
  rule("main landmark", (body) => body.includes("className=\"sx-admin-shell\"")),
  rule("artifact panel label", (body) => body.includes("aria-label=\"成果物\""))
]);
checkFile("AdminActions", "apps/web/src/features/admin/AdminActions.tsx", [
  rule("admin action label", (body) => body.includes("aria-label=\"管理操作\"")),
  rule("evaluation disabled state", (body) => body.includes("disabled={!props.csrfToken || !datasetId}")),
  rule("evaluation progress status", (body) => body.includes("<p role=\"status\">評価実行を開始しています</p>"))
]);
checkFile("ArtifactTable", "apps/web/src/features/admin/ArtifactTable.tsx", [
  rule("empty artifact status", (body) => body.includes("成果物はありません")),
  rule("artifact links from API data", (body) => body.includes("href={artifact.viewer_path}") && body.includes("{artifact.title}")),
  rule("details drawer status", (body) => body.includes("<p role=\"status\">成果物を選択すると詳細を表示します</p>"))
]);
checkFile("UI components", "packages/ui/src/components.tsx", [
  rule("data table export", (body) => body.includes("export { DataTable }")),
  rule("dialog export", (body) => body.includes("export { Dialog }")),
  rule("drawer export", (body) => body.includes("export { Drawer }")),
  rule("citation drawer export", (body) => body.includes("export { CitationDrawer"))
]);
checkFile("UI atoms", "packages/ui/src/atoms/Button.tsx", [
  rule("button type default", (body) => body.includes("type={props.type || \"button\"}")),
  rule("button recipe", (body) => body.includes("buttonRecipe")),
]);
checkFile("UI theme", "packages/ui/src/theme.css.ts", [
  rule("theme contract", (body) => body.includes("createThemeContract")),
  rule("recipe boundary", (body) => body.includes("@vanilla-extract/recipes")),
]);
checkFile("UI dialog", "packages/ui/src/organisms/Dialog.tsx", [
  rule("radix dialog primitive", (body) => body.includes("@radix-ui/react-dialog") && body.includes("RadixDialog.Content")),
  rule("dialog title", (body) => body.includes("RadixDialog.Title"))
]);
checkFile("UI drawer", "packages/ui/src/organisms/Drawer.tsx", [
  rule("radix drawer primitive", (body) => body.includes("@radix-ui/react-dialog") && body.includes("RadixDialog.Content")),
  rule("drawer title", (body) => body.includes("RadixDialog.Title"))
]);
checkFile("UI panel", "packages/ui/src/organisms/Panel.tsx", [
  rule("panel labelled section", (body) => body.includes("<section") && body.includes("aria-label={props[\"aria-label\"]}")),
]);
checkFile("UI message thread", "packages/ui/src/organisms/MessageThread.tsx", [
  rule("thread empty status", (body) => body.includes("<p role=\"status\">{props.emptyLabel}</p>")),
]);
checkFile("UI status", "packages/ui/src/molecules/StatusBadge.tsx", [
  rule("status accessible name", (body) => body.includes("aria-label={`状態: ${props.status}`}"))
]);

const violations = checks.filter((item) => item.status === "failed");
const report = {
  schema_version: "web-a11y-local.v1",
  generated_by: "tools/check-web-accessibility-report.js",
  checks,
  violations: violations.length,
  note: "静的 source gate によるローカル a11y 検査。axe/Playwright の実 DOM report ではない。"
};
write("dist/reports/web-a11y-local.json", `${JSON.stringify(report, null, 2)}\n`);
assert(violations.length === 0, `web accessibility violations: ${violations.map((item) => item.name).join(", ")}`);
console.log(`web accessibility check passed (${checks.length} checks, violations=0)`);

function checkFile(label, path, rules) {
  const body = readText(path);
  for (const item of rules) {
    try {
      assert(item.predicate(body), `${label}: ${item.name}`);
      checks.push({ file: path, name: `${label}: ${item.name}`, status: "passed" });
    } catch (error) {
      checks.push({ file: path, name: `${label}: ${item.name}`, status: "failed", error: error.message });
    }
  }
}

function rule(name, predicate) {
  return { name, predicate };
}

function write(path, body) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}
