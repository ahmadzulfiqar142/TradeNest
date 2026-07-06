"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/supabase/server";
import { loginSchema, type LoginFormValues } from "@/schemas/auth";
import {
  setActiveWorkspaceId,
  clearActiveWorkspaceId,
} from "@/lib/workspace-cookie";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  revalidatePath("/", "layout");

  if (member?.workspace_id) {
    await setActiveWorkspaceId(member.workspace_id);
    redirect("/");
  }

  redirect("/onboarding");
}

export async function signup(
  email: string,
  password: string,
  fullName: string,
) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { url: data.url };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearActiveWorkspaceId();
  redirect("/login");
}
