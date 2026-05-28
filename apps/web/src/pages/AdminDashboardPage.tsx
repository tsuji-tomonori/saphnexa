import { QueryClientProvider } from "@tanstack/react-query";
import { AppShell, Panel } from "../../../../packages/ui/src/components";
import { AdminActions } from "../features/admin/AdminActions";
import { ArtifactTable } from "../features/admin/ArtifactTable";
import { useAdminArtifacts } from "../hooks/useAdminArtifacts";
import { useMe } from "../hooks/useMe";
import { queryClient } from "../lib/queryClient";

export function AdminDashboardContent() {
  const me = useMe();
  const artifacts = useAdminArtifacts();
  const csrfToken = me.data?.csrf_token ?? "";

  return (
    <AppShell className="sx-admin-shell">
      <AdminActions csrfToken={csrfToken} />
      <Panel aria-label="成果物">
        <ArtifactTable artifacts={artifacts.data?.artifacts ?? []} />
      </Panel>
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
