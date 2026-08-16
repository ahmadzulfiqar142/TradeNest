"use server";

import { createClient, createAdminClient } from "@/supabase/server";

export async function getAuthorizedUser(workspaceId: string) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null, error: "Unauthorized" };
  const admin = createAdminClient();
  const { data: member } = await admin
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();
  return member
    ? { supabase, user, error: null }
    : { supabase, user: null, error: "You do not have access to this workspace." };
}
