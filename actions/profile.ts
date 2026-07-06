"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/supabase/server";

export type ProfileActionState = {
  message: string;
  success: boolean;
};

export async function updateProfile(
  profileId: string,
  data: { full_name: string; avatar_url?: string },
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { message: "Unauthorized", success: false };

  const full_name = data.full_name;

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ full_name })
    .eq("id", profileId);

  if (error) return { message: error.message, success: false };

  revalidatePath("/settings");
  return { message: "Profile updated successfully", success: true };
}
