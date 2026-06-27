import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's workspaces
  const { data: workspaces } = await supabase
    .from("workspace_members")
    .select(
      `
      workspaces (
        slug
      )
    `
    )
    .eq("user_id", user.id)
    .limit(1);

  if (workspaces && workspaces.length > 0) {
    // Redirect to first workspace dashboard
    const workspace = workspaces[0].workspaces as { slug: string } | null;
    if (workspace) {
      redirect(`/${workspace.slug}/dashboard`);
    }
  }

  // No workspaces found, redirect to onboarding
  redirect("/onboarding");
}
