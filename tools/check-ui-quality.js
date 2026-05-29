import { assert, listFiles, readText } from "./lib.js";

const files = listFiles(["apps/web/src"], (path) => path.endsWith(".tsx"));
assert(files.length >= 2, "web TSX files must exist");

let commonUiUsers = 0;
let componentCandidates = 0;
for (const file of files) {
  const body = readText(file);
  if (/export function [A-Z]/.test(body)) componentCandidates += 1;
  if (body.includes("packages/ui/src/components") || body.includes("@saphnexa/ui")) commonUiUsers += 1;
  assert(!/\sstyle=\{/.test(body), `${file} contains inline style prop`);
  assert(!/<button(?![^>]*\stype=)/.test(body), `${file} contains button without explicit type`);
  if (file.includes("ChatPage")) {
    assert(body.includes("className=\"sx-chat-shell\""), "ChatPage must expose chat shell landmark through AppShell");
    assert(body.includes("useChatSessions"), "ChatPage must use TanStack Query chat hook");
    assert(body.includes("useMessageEvents"), "ChatPage must use TanStack Query message events hook");
    assert(body.includes("createSaphnexaAssistantAdapter"), "ChatPage must bind assistant-ui runtime adapter boundary");
  }
  if (file.includes("ChatSessionNav")) {
    assert(body.includes("<nav") && body.includes("aria-label=\"チャット一覧\""), "ChatApp must expose labelled chat navigation");
    assert(body.includes("<p role=\"status\">チャットはありません</p>"), "ChatApp must render an honest empty chat state");
  }
  if (file.includes("MessageComposer")) {
    assert(body.includes("aria-label=\"質問\""), "ChatApp textarea must have an accessible label");
    assert(body.includes("useForm") && body.includes("zodResolver") && body.includes("questionSchema"), "MessageComposer must use React Hook Form + Zod validation");
    assert(body.includes("disabled={!props.csrfToken || !question}"), "MessageComposer must disable submit without token or question");
  }
  if (file.includes("MessageEventsPanel")) {
    assert(body.includes("MessageThread") && body.includes("emptyLabel=\"イベントはありません\""), "ChatApp must render events through MessageThread with an honest empty state");
  }
  if (file.includes("AdminDashboardPage")) {
    assert(body.includes("className=\"sx-admin-shell\""), "AdminApp must expose admin shell landmark through AppShell");
    assert(body.includes("useAdminArtifacts"), "Admin page must use TanStack Query artifact hook");
  }
  if (file.includes("AdminActions")) {
    assert(body.includes("aria-label=\"管理操作\""), "AdminApp must label admin actions");
    assert(body.includes("disabled={!props.csrfToken || !datasetId}"), "Admin evaluation must require csrf token and dataset id");
    assert(!body.includes("dataset-local-golden"), "Admin UI must not hard-code a dataset id");
  }
  if (file.includes("ArtifactTable")) {
    assert(body.includes("成果物はありません"), "AdminApp must render an honest empty artifact state");
  }
}

const componentsSource = readText("packages/ui/src/components.tsx");
const statusSource = readText("packages/ui/src/molecules/StatusBadge.tsx");
const tableSource = readText("packages/ui/src/organisms/DataTable.tsx");
const sidebarSource = readText("packages/ui/src/organisms/Sidebar.tsx");
const messageThreadSource = readText("packages/ui/src/organisms/MessageThread.tsx");
assert(statusSource.includes("aria-label={`状態: ${props.status}`}"), "StatusBadge must expose an accessible status label");
assert(componentsSource.includes("export { DataTable }"), "UI barrel must export DataTable organism");
assert(componentsSource.includes("export { CitationDrawer"), "UI barrel must export CitationDrawer organism");
assert(componentsSource.includes("export { Sidebar }"), "UI barrel must export Sidebar organism");
assert(componentsSource.includes("export { MessageThread"), "UI barrel must export MessageThread organism");
assert(tableSource.includes("<table") && tableSource.includes("<caption>"), "DataTable must render a labelled table");
assert(sidebarSource.includes("<aside") && sidebarSource.includes("aria-label={props[\"aria-label\"]}"), "Sidebar must render a labelled aside");
assert(messageThreadSource.includes("<ol") && messageThreadSource.includes("emptyLabel"), "MessageThread must render a labelled ordered event thread with empty state");

const usageRate = componentCandidates === 0 ? 0 : commonUiUsers / componentCandidates;
assert(usageRate >= 0.7, `common UI package usage below 70%: ${(usageRate * 100).toFixed(1)}%`);

console.log(`UI quality check passed (common_ui_usage=${(usageRate * 100).toFixed(1)}%, inline_style_violations=0)`);
