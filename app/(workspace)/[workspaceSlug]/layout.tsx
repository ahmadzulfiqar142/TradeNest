import { notFound, redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { WorkspaceSidebar } from "@/features/workspace/components/workspace-sidebar";
import { WorkspaceHeader } from "@/features/workspace/components/workspace-header";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { workspaceSlug: string };
}) {
  const supabase = await createClient();
  const { workspaceSlug } = await params;

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Get workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("slug", workspaceSlug)
    .single();

  if (workspaceError || !workspace) {
    notFound();
  }

  // Check if user is a member
  const { data: member, error: memberError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .single();

  if (memberError || !member) {
    redirect("/create-workspace");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <WorkspaceSidebar workspace={workspace} userRole={member.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <WorkspaceHeader workspace={workspace} user={user} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
