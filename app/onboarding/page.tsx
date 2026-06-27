import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Check if user already has a workspace
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
    // User already has a workspace, redirect to dashboard
    const workspace = workspaces[0].workspaces as { slug: string } | null;
    if (workspace) {
      redirect(`/${workspace.slug}/dashboard`);
    }
  }

  // Show onboarding wizard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <OnboardingWizard user={user} />
      </div>
    </div>
  );
}
