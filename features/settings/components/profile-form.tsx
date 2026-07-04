"use client";

import { useActionState, useRef, useState } from "react";
import { Loader2, Upload, User, X } from "lucide-react";
import { updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { createClient } from "@/supabase/client";

interface ProfileFormProps {
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const AVATAR_BUCKET = "avatars"; // ← Change if your bucket name is different

export function ProfileForm({ profile }: ProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const [state, formAction, pending] = useActionState(
    async (
      previousState: { message: string; success: boolean },
      formData: FormData,
    ) => updateProfile(profile.id, previousState, formData),
    { message: "", success: false },
  );

  async function handleAvatarUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadMessage("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage("Image must be smaller than 5MB.");
      return;
    }

    setUploading(true);
    setUploadMessage("");

    const supabase = createClient();
    const fileExtension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${profile.id}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (error) {
      setUploadMessage(error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    setAvatarUrl(data.publicUrl);
    setUploadMessage("Avatar uploaded successfully.");
    setUploading(false);
  }

  const removeAvatar = () => {
    setAvatarUrl("");
    setUploadMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="max-w-2xl bg-gray-800 border-gray-700">
      <form action={formAction} className="space-y-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer"
              >
                <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-gray-800 shadow-md bg-gray-700 hover:ring-2 hover:ring-blue-500 transition-all">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-700">
                      <User className="h-14 w-14 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full transition-all">
                  <div className="text-white text-xs font-medium flex flex-col items-center">
                    <Upload className="h-5 w-5 mb-1" />
                    Change
                  </div>
                </div>

                {/* Remove button */}
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleAvatarUpload(file);
                }}
              />
            </div>

            <div>
              <CardTitle className="text-gray-100">Profile</CardTitle>
              <CardDescription className="text-gray-400">
                Update your personal information and avatar.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <input type="hidden" name="avatar_url" value={avatarUrl} />

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-gray-300">
              Full Name
            </Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={profile.full_name ?? ""}
              placeholder="John Doe"
              disabled={pending}
              className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-600"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">
              Email
            </Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="bg-gray-700 border-gray-600 text-gray-500"
            />
          </div>

          {uploadMessage && (
            <p className="text-sm text-gray-400" aria-live="polite">
              {uploadMessage}
            </p>
          )}

          {state.message && (
            <p
              className={`text-sm font-medium ${
                state.success ? "text-green-400" : "text-red-400"
              }`}
            >
              {state.message}
            </p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
