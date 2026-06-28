import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/supabase/server";
import { setActiveWorkspaceId } from "@/lib/workspace-cookie";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) redirect("/login");

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (member?.workspace_id) {
    await setActiveWorkspaceId(member.workspace_id);
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <OnboardingWizard user={user} />
      </div>
    </div>
  );
}
