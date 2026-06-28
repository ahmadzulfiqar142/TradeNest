import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/supabase/server";
import { setActiveWorkspaceId } from "@/lib/workspace-cookie";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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

  redirect("/onboarding");
}
