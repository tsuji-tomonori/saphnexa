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
  rule("assistant runtime provider boundary", (body) => body.includes("AssistantRuntimeBoundary")),
  rule("feedback panel", (body) => body.includes("FeedbackPanel")),
  rule("favorite panel", (body) => body.includes("FavoritePanel"))
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
checkFile("FeedbackPanel", "apps/web/src/features/chat/FeedbackPanel.tsx", [
  rule("section label", (body) => body.includes("aria-label=\"回答フィードバック\"")),
  rule("comment textarea label", (body) => body.includes("aria-label=\"フィードバックコメント\"")),
  rule("submitted status", (body) => body.includes("<p role=\"status\">フィードバックを登録しました")),
  rule("pending status", (body) => body.includes("<p role=\"status\">フィードバックを送信しています</p>")),
  rule("button disabled state", (body) => body.includes("!props.csrfToken || !props.activeChatId || !props.activeMessageId || props.isPending")),
  rule("button type", (body) => !/<button(?![^>]*\stype=)/.test(body))
]);
checkFile("FavoritePanel", "apps/web/src/features/chat/FavoritePanel.tsx", [
  rule("section label", (body) => body.includes("aria-label=\"お気に入り\"")),
  rule("favorite table", (body) => body.includes("DataTable") && body.includes("caption=\"お気に入り一覧\"")),
  rule("empty favorite status", (body) => body.includes("empty=\"お気に入りはありません\"")),
  rule("button disabled state", (body) => body.includes("disabled={!props.csrfToken || !props.activeChatId || props.isMutating}")),
  rule("button type", (body) => !/<button(?![^>]*\stype=)/.test(body))
]);
checkFile("AdminApp", "apps/web/src/admin/AdminApp.tsx", [
  rule("page wrapper", (body) => body.includes("<AdminDashboardPage />"))
]);
checkFile("AdminDashboardPage", "apps/web/src/pages/AdminDashboardPage.tsx", [
  rule("main landmark", (body) => body.includes("className=\"sx-admin-shell\"")),
  rule("admin tabs", (body) => body.includes("Tabs") && body.includes("aria-label=\"管理領域\"")),
  rule("user panel label", (body) => body.includes("aria-label=\"ユーザー\"")),
  rule("user import panel", (body) => body.includes("UserImportPanel")),
  rule("user table", (body) => body.includes("UserTable")),
  rule("artifact panel label", (body) => body.includes("aria-label=\"成果物\"")),
  rule("document panel label", (body) => body.includes("aria-label=\"文書\"")),
  rule("document registration form", (body) => body.includes("DocumentRegistrationForm")),
  rule("document lifecycle panel", (body) => body.includes("DocumentVersionLifecyclePanel")),
  rule("ingestion job panel", (body) => body.includes("IngestionJobPanel"))
]);
checkFile("AdminActions", "apps/web/src/features/admin/AdminActions.tsx", [
  rule("admin action label", (body) => body.includes("aria-label=\"管理操作\"")),
  rule("evaluation disabled state", (body) => body.includes("disabled={!props.csrfToken || !datasetId}")),
  rule("evaluation progress status", (body) => body.includes("<p role=\"status\">評価実行を開始しています</p>"))
]);
checkFile("UserImportPanel", "apps/web/src/features/admin/UserImportPanel.tsx", [
  rule("section label", (body) => body.includes("aria-label=\"ユーザー取込\"")),
  rule("form label", (body) => body.includes("aria-label=\"ユーザー取込フォーム\"")),
  rule("textarea label", (body) => body.includes("aria-label=\"JSON rows\"")),
  rule("honest upload state", (body) => body.includes("CSV/Excel実アップロード: 未接続")),
  rule("pending status", (body) => body.includes("<p role=\"status\">ユーザー取込を確認しています</p>")),
  rule("error alert", (body) => body.includes("role=\"alert\"")),
  rule("button disabled state", (body) => body.includes("disabled={!props.csrfToken || startImport.isPending}"))
]);
checkFile("UserTable", "apps/web/src/features/admin/UserTable.tsx", [
  rule("empty user status", (body) => body.includes("ユーザーはありません")),
  rule("user rows from API data", (body) => body.includes("user.email") && body.includes("user.user_id")),
  rule("status badge", (body) => body.includes("StatusBadge"))
]);
checkFile("ArtifactTable", "apps/web/src/features/admin/ArtifactTable.tsx", [
  rule("empty artifact status", (body) => body.includes("成果物はありません")),
  rule("artifact links from API data", (body) => body.includes("href={artifact.viewer_path}") && body.includes("{artifact.title}")),
  rule("details drawer status", (body) => body.includes("<p role=\"status\">成果物を選択すると詳細を表示します</p>"))
]);
checkFile("DocumentTable", "apps/web/src/features/admin/DocumentTable.tsx", [
  rule("empty document status", (body) => body.includes("文書はありません")),
  rule("document rows from API data", (body) => body.includes("document.title") && body.includes("document.document_id")),
  rule("status badge", (body) => body.includes("StatusBadge"))
]);
checkFile("DocumentRegistrationForm", "apps/web/src/features/admin/DocumentRegistrationForm.tsx", [
  rule("form label", (body) => body.includes("aria-label=\"文書登録フォーム\"")),
  rule("field labels", (body) => body.includes("label=\"文書名\"") && body.includes("label=\"PDFファイル名\"")),
  rule("pending status", (body) => body.includes("<p role=\"status\">文書登録を開始しています</p>")),
  rule("honest upload state", (body) => body.includes("PDF実アップロード: 未接続")),
  rule("error alert", (body) => body.includes("role=\"alert\"")),
  rule("button disabled state", (body) => body.includes("disabled={!props.csrfToken || createDocument.isPending}"))
]);
checkFile("DocumentVersionLifecyclePanel", "apps/web/src/features/admin/DocumentVersionLifecyclePanel.tsx", [
  rule("section label", (body) => body.includes("aria-label=\"文書版ライフサイクル\"")),
  rule("lookup form label", (body) => body.includes("aria-label=\"文書詳細検索フォーム\"")),
  rule("version form label", (body) => body.includes("aria-label=\"文書版追加フォーム\"")),
  rule("acl form label", (body) => body.includes("aria-label=\"文書ACL更新フォーム\"")),
  rule("field labels", (body) => body.includes("label=\"文書ID\"") && body.includes("label=\"PDFファイル名\"")),
  rule("pending status", (body) => body.includes("<p role=\"status\">文書版の状態を更新しています</p>")),
  rule("honest ingestion state", (body) => body.includes("PDF実アップロードとStep Functions実行: 未接続")),
  rule("honest acl sync state", (body) => body.includes("Cognito group反映、Bedrock KB / S3 Vectors metadata再同期: 未接続")),
  rule("honest physical delete state", (body) => body.includes("物理削除、S3 object delete、Bedrock KB / S3 Vectors delete: 未接続")),
  rule("activation disabled state", (body) => body.includes("disabled={!props.csrfToken || version.status !== \"succeeded\" || activateVersion.isPending}")),
  rule("acl update disabled state", (body) => body.includes("disabled={!props.csrfToken || !documentId || !aclVersionId || !aclScopeId || updateDocumentAcl.isPending}")),
  rule("suspend disabled state", (body) => body.includes("disabled={!props.csrfToken || document.status === \"deleted\" || suspendDocument.isPending}")),
  rule("error alert", (body) => body.includes("role=\"alert\""))
]);
checkFile("IngestionJobPanel", "apps/web/src/features/admin/IngestionJobPanel.tsx", [
  rule("section label", (body) => body.includes("aria-label=\"取り込みジョブ確認\"")),
  rule("form label", (body) => body.includes("aria-label=\"取り込みジョブ確認フォーム\"")),
  rule("field label", (body) => body.includes("label=\"取り込みジョブID\"")),
  rule("empty status", (body) => body.includes("取り込みジョブを選択してください")),
  rule("pending status", (body) => body.includes("<p role=\"status\">取り込みジョブを確認しています</p>")),
  rule("retry disabled state", (body) => body.includes("disabled={!props.csrfToken || !job?.retryable || retry.isPending}")),
  rule("error alert", (body) => body.includes("role=\"alert\""))
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
checkFile("UI tabs", "packages/ui/src/organisms/Tabs.tsx", [
  rule("radix tabs primitive", (body) => body.includes("@radix-ui/react-tabs") && body.includes("RadixTabs.List")),
  rule("labelled tabs list", (body) => body.includes("aria-label={props[\"aria-label\"]}"))
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
