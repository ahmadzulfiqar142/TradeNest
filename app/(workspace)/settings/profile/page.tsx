import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/supabase/server";
import { ProfileForm } from "@/features/settings/components/profile-form";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500">Manage your personal information.</p>
      </div>
      <ProfileForm
        profile={profile ?? { id: user.id, email: user.email ?? "", full_name: null, avatar_url: null }}
      />
    </div>
  );
}
