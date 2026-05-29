import { QueryClientProvider } from "@tanstack/react-query";
import { AppShell, Panel, Tabs } from "@saphnexa/ui";
import { AdminActions } from "../features/admin/AdminActions";
import { ArtifactTable } from "../features/admin/ArtifactTable";
import { DocumentRegistrationForm } from "../features/admin/DocumentRegistrationForm";
import { DocumentTable } from "../features/admin/DocumentTable";
import { DocumentVersionLifecyclePanel } from "../features/admin/DocumentVersionLifecyclePanel";
import { IngestionJobPanel } from "../features/admin/IngestionJobPanel";
import { UserImportPanel } from "../features/admin/UserImportPanel";
import { UserTable } from "../features/admin/UserTable";
import { useAdminArtifacts } from "../hooks/useAdminArtifacts";
import { useAdminDocuments } from "../hooks/useAdminDocuments";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useMe } from "../hooks/useMe";
import { queryClient } from "../lib/queryClient";

export function AdminDashboardContent() {
  const me = useMe();
  const artifacts = useAdminArtifacts();
  const documents = useAdminDocuments();
  const users = useAdminUsers();
  const csrfToken = me.data?.csrf_token ?? "";

  return (
    <AppShell className="sx-admin-shell">
      <Tabs
        aria-label="管理領域"
        defaultValue="evaluation"
        items={[
          {
            id: "evaluation",
            label: "評価",
            content: <AdminActions csrfToken={csrfToken} />
          },
          {
            id: "users",
            label: "ユーザー",
            content: (
              <Panel aria-label="ユーザー">
                <UserImportPanel csrfToken={csrfToken} />
                <UserTable users={users.data?.users ?? []} />
              </Panel>
            )
          },
          {
            id: "artifacts",
            label: "成果物",
            content: (
              <Panel aria-label="成果物">
                <ArtifactTable artifacts={artifacts.data?.artifacts ?? []} />
              </Panel>
            )
          },
          {
            id: "documents",
            label: "文書",
            content: (
              <Panel aria-label="文書">
                <DocumentRegistrationForm csrfToken={csrfToken} />
                <DocumentVersionLifecyclePanel csrfToken={csrfToken} />
                <IngestionJobPanel csrfToken={csrfToken} />
                <DocumentTable documents={documents.data?.documents ?? []} />
              </Panel>
            )
          }
        ]}
      />
    </AppShell>
  );
}

export function AdminDashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminDashboardContent />
    </QueryClientProvider>
  );
}
