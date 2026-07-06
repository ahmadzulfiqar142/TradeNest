"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, User, X } from "lucide-react";
import { updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createClient } from "@/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { updateProfileSchema, type UpdateProfileFormValues } from "@/schemas/profile";

interface ProfileFormProps {
  profile: { id: string; email: string; full_name: string | null; avatar_url: string | null };
}

const AVATAR_BUCKET = "avatars";

export function ProfileForm({ profile }: ProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const { success, error } = useToast();

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      full_name: profile.full_name ?? "",
      avatar_url: profile.avatar_url ?? "",
    },
  });

  const avatarUrl = form.watch("avatar_url");

  async function handleAvatarUpload(file: File) {
    if (!file.type.startsWith("image/")) { setUploadMessage("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadMessage("Image must be smaller than 5MB."); return; }
    setUploading(true);
    setUploadMessage("");
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${profile.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(filePath, file, { cacheControl: "3600", upsert: true });
    if (uploadError) { setUploadMessage(uploadError.message); setUploading(false); return; }
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
    form.setValue("avatar_url", data.publicUrl);
    setUploadMessage("Avatar uploaded successfully.");
    setUploading(false);
  }

  const onSubmit = async (data: UpdateProfileFormValues) => {
    const result = await updateProfile(profile.id, { full_name: data.full_name, avatar_url: data.avatar_url });
    if (result.success) success(result.message);
    else error(result.message);
  };

  return (
    <Card className="max-w-2xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              {/* Avatar upload — wired via form.setValue */}
              <div className="space-y-2">
                <div onClick={() => fileInputRef.current?.click()} className="relative group cursor-pointer">
                  <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-border bg-muted hover:ring-2 hover:ring-ring transition-all">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full transition-all">
                    <div className="text-white text-xs font-medium flex flex-col items-center">
                      <Upload className="h-4 w-4 mb-1" />Change
                    </div>
                  </div>
                  {avatarUrl && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); form.setValue("avatar_url", ""); setUploadMessage(""); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleAvatarUpload(f); }} />
              </div>
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information and avatar.</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} disabled={form.formState.isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input value={profile.email} disabled />
            </FormItem>

            {uploadMessage && <p className="text-sm text-muted-foreground" aria-live="polite">{uploadMessage}</p>}

            <Button type="submit" disabled={form.formState.isSubmitting || uploading}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
