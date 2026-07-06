import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { setActiveWorkspaceId } from "@/lib/workspace-cookie";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      redirect("/login?error=auth_failed");
    }

    if (data.user) {
      // Get user's workspace
      const admin = supabase;
      const { data: member } = await admin
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();

      if (member?.workspace_id) {
        await setActiveWorkspaceId(member.workspace_id);
        redirect("/");
      }
    }
  }

  // If no code or no workspace, redirect to onboarding
  redirect("/onboarding");
}
