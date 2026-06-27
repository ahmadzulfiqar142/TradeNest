"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  type CreateWorkspaceFormValues,
  type UpdateWorkspaceFormValues,
} from "@/schemas/workspace";

export async function createWorkspace(data: CreateWorkspaceFormValues) {
  const validatedData = createWorkspaceSchema.parse(data);
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Unauthorized" };
  }

  // Check if slug already exists
  const { data: existingWorkspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", validatedData.slug)
    .single();

  if (existingWorkspace) {
    return { error: "Workspace slug already exists" };
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
    return { error: workspaceError.message };
  }

  // Add user as owner
  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    return { error: memberError.message };
  }

  revalidatePath("/");
  redirect(`/${workspace.slug}/dashboard`);
}

export async function updateWorkspace(
  workspaceId: string,
  data: UpdateWorkspaceFormValues
) {
  const validatedData = updateWorkspaceSchema.parse(data);
  const supabase = await createClient();

  const { error } = await supabase
    .from("workspaces")
    .update({
      name: validatedData.name,
      business_address: validatedData.businessAddress,
      business_phone: validatedData.businessPhone,
      business_email: validatedData.businessEmail,
      business_whatsapp: validatedData.businessWhatsapp,
      currency: validatedData.currency,
      timezone: validatedData.timezone,
      invoice_prefix: validatedData.invoicePrefix,
    })
    .eq("id", workspaceId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function getWorkspaces() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: [], error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select(
      `
      workspace_id,
      role,
      workspaces (
        id,
        name,
        slug,
        logo_url,
        created_at
      )
    `
    )
    .eq("user_id", user.id);

  if (error) {
    return { data: [], error: error.message };
  }

  return { data, error: null };
}

export async function getWorkspaceBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function deleteWorkspace(workspaceId: string) {
  const supabase = await createClient();

  // Check if user is owner
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single();

  if (!member || member.role !== "owner") {
    return { error: "Only workspace owners can delete workspaces" };
  }

  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", workspaceId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  redirect("/");
}
