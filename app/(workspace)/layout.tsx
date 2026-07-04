import { notFound, redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { WorkspaceLayoutClient } from "@/features/workspace/components/workspace-layout-client";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

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
    <WorkspaceLayoutClient
      workspace={workspace}
      userRole={member.role}
      user={user}
    >
      {children}
    </WorkspaceLayoutClient>
  );
}
