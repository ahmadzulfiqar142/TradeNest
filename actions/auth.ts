"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { loginSchema, type LoginFormValues } from "@/schemas/auth";

export async function login(data: LoginFormValues) {
  const validatedData = loginSchema.parse(data);

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: validatedData.email,
    password: validatedData.password,
  });

  if (signInError) {
    return { error: signInError.message };
  }

  revalidatePath("/", "layout");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // === Check workspace membership ===
  const { data: member, error: memberError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (memberError && memberError.code !== "PGRST116") {
    // PGRST116 = no rows returned (expected for new users)
    console.error("Member check error:", memberError);
    redirect("/onboarding");
  }

  if (member?.workspace_id) {
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("slug")
      .eq("id", member.workspace_id)
      .single();

    if (workspaceError || !workspace?.slug) {
      console.error("Workspace fetch error:", workspaceError);
      redirect("/onboarding");
    }

    redirect(`/${workspace.slug}/dashboard`);
  }

  // No workspace → go to onboarding (new users)
  redirect("/onboarding");
}

export async function signup(
  email: string,
  password: string,
  fullName: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation is disabled in Supabase, redirect to onboarding
  if (data.user && data.session) {
    revalidatePath("/", "layout");
    redirect("/onboarding");
  }

  return { data };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
