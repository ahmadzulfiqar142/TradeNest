"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import {
  createWorkspaceSchema,
  type CreateWorkspaceFormValues,
} from "@/schemas/workspace";

export async function createWorkspaceOnboarding(data: CreateWorkspaceFormValues) {
  const validatedData = createWorkspaceSchema.parse(data);
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Unauthorized", success: false };
  }

  // Check if slug already exists
  const { data: existingWorkspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", validatedData.slug)
    .single();

  if (existingWorkspace) {
    return { error: "Workspace slug already exists", success: false };
  }

  // Create workspace
  const { data: workspace, error: workspaceError } = await supabase
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
  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    return { error: memberError.message, success: false };
  }

  revalidatePath("/");
  
  return { 
    success: true, 
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    }
  };
}
