import { notFound, redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { SidebarSwitcher } from "@/features/workspace/components/sidebar-switcher";
import { WorkspaceHeader } from "@/features/workspace/components/workspace-header";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) redirect("/login");

  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/onboarding");

  const admin = createAdminClient();

  const { data: workspace } = await admin
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace) notFound();

  const { data: member } = await admin
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) redirect("/onboarding");

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarSwitcher workspace={workspace} userRole={member.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <WorkspaceHeader workspace={workspace} user={user} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
