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
    assert(body.includes("useChatParticipants"), "ChatPage must use TanStack Query participants hook");
    assert(body.includes("ChatParticipantsPanel"), "ChatPage must render participants panel through feature component");
    assert(body.includes("useMessageEvents"), "ChatPage must use TanStack Query message events hook");
    assert(body.includes("useCreateFeedback"), "ChatPage must use TanStack Query feedback hook");
    assert(body.includes("FeedbackPanel"), "ChatPage must render feedback panel through feature component");
    assert(body.includes("useFavorites"), "ChatPage must use TanStack Query favorites hook");
    assert(body.includes("FavoritePanel"), "ChatPage must render favorite panel through feature component");
    assert(body.includes("AssistantRuntimeBoundary"), "ChatPage must bind assistant-ui runtime provider boundary");
    assert(body.includes("submitAssistantQuestion"), "ChatPage must submit through assistant route helper boundary");
  }
  if (file.includes("AssistantRuntimeBoundary")) {
    assert(body.includes("AssistantRuntimeProvider"), "AssistantRuntimeBoundary must provide assistant-ui runtime");
    assert(body.includes("useLocalRuntime"), "AssistantRuntimeBoundary must create a local assistant-ui runtime");
    assert(body.includes("createSaphnexaAssistantAdapter"), "AssistantRuntimeBoundary must bind the Saphnexa chat model adapter");
  }
  if (file.includes("ChatSessionNav")) {
    assert(body.includes("<nav") && body.includes("aria-label=\"チャット一覧\""), "ChatApp must expose labelled chat navigation");
    assert(body.includes("<p role=\"status\">チャットはありません</p>"), "ChatApp must render an honest empty chat state");
  }
  if (file.includes("ChatParticipantsPanel")) {
    assert(body.includes("DataTable"), "Chat participants must render through DataTable");
    assert(body.includes("参加者一覧"), "Chat participants must expose a table caption");
    assert(body.includes("チャットを選択してください"), "Chat participants must render an honest no-chat state");
    assert(body.includes("StatusBadge"), "Chat participants must show status through StatusBadge");
    assert(!body.includes("user-local"), "Chat participants must not hard-code local user ids");
  }
  if (file.includes("MessageComposer")) {
    assert(body.includes("aria-label=\"質問\""), "ChatApp textarea must have an accessible label");
    assert(body.includes("useForm") && body.includes("zodResolver") && body.includes("questionSchema"), "MessageComposer must use React Hook Form + Zod validation");
    assert(body.includes("disabled={!props.csrfToken || !question}"), "MessageComposer must disable submit without token or question");
  }
  if (file.includes("MessageEventsPanel")) {
    assert(body.includes("MessageThread") && body.includes("emptyLabel=\"イベントはありません\""), "ChatApp must render events through MessageThread with an honest empty state");
  }
  if (file.includes("FeedbackPanel")) {
    assert(body.includes("Textarea"), "Chat feedback must expose a comment textarea");
    assert(body.includes("フィードバックを登録しました"), "Chat feedback must render a submitted status from mutation data");
    assert(body.includes("!props.csrfToken || !props.activeChatId || !props.activeMessageId || props.isPending"), "Chat feedback action must require token, chat, and message");
    assert(!body.includes("feedback-local"), "Chat feedback must not hard-code local feedback ids");
    assert(!body.includes("msg-local"), "Chat feedback must not hard-code local message ids");
  }
  if (file.includes("FavoritePanel")) {
    assert(body.includes("DataTable"), "Chat favorites must render through DataTable");
    assert(body.includes("お気に入りはありません"), "Chat favorites must render an honest empty favorite state");
    assert(body.includes("disabled={!props.csrfToken || !props.activeChatId || props.isMutating}"), "Chat favorite action must require token and active chat");
    assert(!body.includes("fav-local"), "Chat favorites must not hard-code local favorite ids");
    assert(!body.includes("chat-local"), "Chat favorites must not hard-code local chat ids");
  }
  if (file.includes("AdminDashboardPage")) {
    assert(body.includes("className=\"sx-admin-shell\""), "AdminApp must expose admin shell landmark through AppShell");
    assert(body.includes("useAdminUsers"), "Admin page must use TanStack Query users hook");
    assert(body.includes("UserImportPanel"), "Admin page must render user import panel through feature component");
    assert(body.includes("UserTable"), "Admin page must render user table through feature component");
    assert(body.includes("useAdminArtifacts"), "Admin page must use TanStack Query artifact hook");
    assert(body.includes("useAdminDocuments"), "Admin page must use TanStack Query document hook");
    assert(body.includes("DocumentRegistrationForm"), "Admin page must render document registration form through feature component");
    assert(body.includes("DocumentVersionLifecyclePanel"), "Admin page must render document version lifecycle through feature component");
    assert(body.includes("IngestionJobPanel"), "Admin page must render ingestion job monitor through feature component");
    assert(body.includes("DocumentTable"), "Admin page must render document table through feature component");
  }
  if (file.includes("AdminActions")) {
    assert(body.includes("aria-label=\"管理操作\""), "AdminApp must label admin actions");
    assert(body.includes("disabled={!props.csrfToken || !datasetId}"), "Admin evaluation must require csrf token and dataset id");
    assert(!body.includes("dataset-local-golden"), "Admin UI must not hard-code a dataset id");
  }
  if (file.includes("ArtifactTable")) {
    assert(body.includes("成果物はありません"), "AdminApp must render an honest empty artifact state");
  }
  if (file.includes("DocumentTable")) {
    assert(body.includes("文書はありません"), "AdminApp must render an honest empty document state");
    assert(body.includes("DataTable"), "Admin documents must render through DataTable");
    assert(!body.includes("doc-local"), "Admin documents must not hard-code local document ids");
  }
  if (file.includes("DocumentRegistrationForm")) {
    assert(body.includes("useForm"), "Admin document registration must use React Hook Form");
    assert(body.includes("zodResolver"), "Admin document registration must use Zod validation");
    assert(body.includes("PDF実アップロード: 未接続"), "Admin document registration must not imply PDF binary upload is implemented");
    assert(!body.includes("doc-local"), "Admin document registration must not hard-code local document ids");
  }
  if (file.includes("DocumentVersionLifecyclePanel")) {
    assert(body.includes("useForm"), "Admin document lifecycle must use React Hook Form");
    assert(body.includes("zodResolver"), "Admin document lifecycle must use Zod validation");
    assert(body.includes("DataTable"), "Admin document lifecycle must render details through DataTable");
    assert(body.includes("PDF実アップロードとStep Functions実行: 未接続"), "Admin document lifecycle must not imply real ingestion is implemented");
    assert(body.includes("Cognito group反映、Bedrock KB / S3 Vectors metadata再同期: 未接続"), "Admin document ACL update must not imply external ACL/index sync is implemented");
    assert(body.includes("物理削除、S3 object delete、Bedrock KB / S3 Vectors delete: 未接続"), "Admin document lifecycle must not imply physical document deletion is implemented");
    assert(body.includes("updateDocumentAcl.isPending"), "Admin document ACL update must expose pending state");
    assert(body.includes("version.status !== \"succeeded\""), "Admin document lifecycle activation must depend on succeeded version status");
    assert(body.includes("document.status === \"deleted\""), "Admin document suspension must depend on document status");
    assert(!body.includes("doc-local"), "Admin document lifecycle must not hard-code local document ids");
  }
  if (file.includes("IngestionJobPanel")) {
    assert(body.includes("useForm"), "Admin ingestion job monitor must use React Hook Form");
    assert(body.includes("zodResolver"), "Admin ingestion job monitor must use Zod validation");
    assert(body.includes("retryable"), "Admin ingestion retry must depend on retryable state");
    assert(!body.includes("ing-local"), "Admin ingestion job monitor must not hard-code local job ids");
  }
  if (file.includes("UserImportPanel")) {
    assert(body.includes("useForm"), "Admin user import must use React Hook Form");
    assert(body.includes("zodResolver"), "Admin user import must use Zod validation");
    assert(body.includes("CSV/Excel実アップロード: 未接続"), "Admin user import must not imply binary CSV/Excel upload is implemented");
    assert(!body.includes("user-local"), "Admin user import must not hard-code local user ids");
  }
  if (file.includes("UserTable")) {
    assert(body.includes("ユーザーはありません"), "Admin users must render an honest empty user state");
    assert(body.includes("DataTable"), "Admin users must render through DataTable");
  }
}

const componentsSource = readText("packages/ui/src/components.tsx");
const themeSource = readText("packages/ui/src/theme.css.ts");
const buttonSource = readText("packages/ui/src/atoms/Button.tsx");
const inputSource = readText("packages/ui/src/atoms/Input.tsx");
const textareaSource = readText("packages/ui/src/atoms/Textarea.tsx");
const statusSource = readText("packages/ui/src/molecules/StatusBadge.tsx");
const dialogSource = readText("packages/ui/src/organisms/Dialog.tsx");
const drawerSource = readText("packages/ui/src/organisms/Drawer.tsx");
const tabsSource = readText("packages/ui/src/organisms/Tabs.tsx");
const tableSource = readText("packages/ui/src/organisms/DataTable.tsx");
const sidebarSource = readText("packages/ui/src/organisms/Sidebar.tsx");
const messageThreadSource = readText("packages/ui/src/organisms/MessageThread.tsx");
for (const token of [
  "createThemeContract",
  "createTheme",
  "@vanilla-extract/recipes",
  "buttonRecipe",
  "controlRecipe",
  "statusBadgeRecipe",
  "tabsListClass",
  "tabsTriggerClass"
]) {
  assert(themeSource.includes(token), `UI theme source missing ${token}`);
}
assert(buttonSource.includes("buttonRecipe"), "Button must use vanilla-extract recipe classes");
assert(inputSource.includes("controlRecipe") && textareaSource.includes("controlRecipe"), "form controls must use vanilla-extract recipe classes");
assert(statusSource.includes("aria-label={`状態: ${props.status}`}"), "StatusBadge must expose an accessible status label");
assert(statusSource.includes("statusBadgeRecipe"), "StatusBadge must use vanilla-extract recipe classes");
assert(dialogSource.includes("@radix-ui/react-dialog") && dialogSource.includes("RadixDialog.Content"), "Dialog must use Radix Dialog primitives");
assert(drawerSource.includes("@radix-ui/react-dialog") && drawerSource.includes("RadixDialog.Content"), "Drawer must use Radix Dialog primitives");
assert(tabsSource.includes("@radix-ui/react-tabs") && tabsSource.includes("RadixTabs.List") && tabsSource.includes("RadixTabs.Trigger"), "Tabs must use Radix Tabs primitives");
assert(componentsSource.includes("export { DataTable }"), "UI barrel must export DataTable organism");
assert(componentsSource.includes("export { CitationDrawer"), "UI barrel must export CitationDrawer organism");
assert(componentsSource.includes("export { Sidebar }"), "UI barrel must export Sidebar organism");
assert(componentsSource.includes("export { MessageThread"), "UI barrel must export MessageThread organism");
assert(componentsSource.includes("export { Tabs"), "UI barrel must export Tabs organism");
assert(tableSource.includes("<table") && tableSource.includes("<caption>"), "DataTable must render a labelled table");
assert(sidebarSource.includes("<aside") && sidebarSource.includes("aria-label={props[\"aria-label\"]}"), "Sidebar must render a labelled aside");
assert(messageThreadSource.includes("<ol") && messageThreadSource.includes("emptyLabel"), "MessageThread must render a labelled ordered event thread with empty state");

const usageRate = componentCandidates === 0 ? 0 : commonUiUsers / componentCandidates;
assert(usageRate >= 0.7, `common UI package usage below 70%: ${(usageRate * 100).toFixed(1)}%`);

console.log(`UI quality check passed (common_ui_usage=${(usageRate * 100).toFixed(1)}%, inline_style_violations=0)`);
