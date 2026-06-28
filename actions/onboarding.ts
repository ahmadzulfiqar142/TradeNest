"use server";

import { createClient, createAdminClient } from "@/supabase/server";
import { createWorkspaceSchema, type CreateWorkspaceFormValues } from "@/schemas/workspace";
import { setActiveWorkspaceId } from "@/lib/workspace-cookie";

export async function createWorkspaceOnboarding(data: CreateWorkspaceFormValues) {
  const validatedData = createWorkspaceSchema.parse(data);

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Unauthorized", success: false };
  }

  const admin = createAdminClient();

  // One workspace per user
  const { data: existingMember } = await admin
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existingMember?.workspace_id) {
    await setActiveWorkspaceId(existingMember.workspace_id);
    return { error: "You already have a workspace", success: false, redirectTo: "/dashboard" };
  }

  // Check slug availability
  const { data: slugTaken } = await admin
    .from("workspaces")
    .select("id")
    .eq("slug", validatedData.slug)
    .maybeSingle();

  if (slugTaken) {
    return { error: "Workspace slug already exists", success: false };
  }

  // Create workspace
  const { data: workspace, error: workspaceError } = await admin
    .from("workspaces")
    .insert({
      name: validatedData.name,
      slug: validatedData.slug,
      business_address: validatedData.businessAddress,
      business_phone: validatedData.businessPhone,
      business_email: validatedData.businessEmail,
      business_whatsapp: validatedData.businessWhatsapp,
    })
    .select()
    .single();

  if (workspaceError) {
    return { error: workspaceError.message, success: false };
  }

  // Add user as owner
  const { error: memberError } = await admin.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    await admin.from("workspaces").delete().eq("id", workspace.id);
    return { error: memberError.message, success: false };
  }

  // Set workspace cookie so layout can resolve it without slug in URL
  await setActiveWorkspaceId(workspace.id);

  return { success: true, redirectTo: "/dashboard" };
}
