"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { createWorkspace } from "@/actions/workspace";
import {
  createWorkspaceSchema,
  type CreateWorkspaceFormValues,
} from "@/schemas/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateWorkspaceForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceSchema),
  });

  const workspaceName = watch("name");

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue("name", name);
    setValue("slug", generateSlug(name));
  };

  const onSubmit = async (data: CreateWorkspaceFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createWorkspace(data);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Workspace Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="My Business"
            {...register("name")}
            onChange={handleNameChange}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            The name of your business or workspace
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Workspace URL *</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              app.yoursite.com/
            </span>
            <Input
              id="slug"
              type="text"
              placeholder="my-business"
              {...register("slug")}
              disabled={isLoading}
              className="flex-1"
            />
          </div>
          {errors.slug && (
            <p className="text-sm text-red-500">{errors.slug.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Unique URL for your workspace (lowercase, no spaces)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessAddress">Business Address</Label>
          <Input
            id="businessAddress"
            type="text"
            placeholder="123 Main Street, City"
            {...register("businessAddress")}
            disabled={isLoading}
          />
          {errors.businessAddress && (
            <p className="text-sm text-red-500">
              {errors.businessAddress.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessPhone">Business Phone</Label>
          <Input
            id="businessPhone"
            type="tel"
            placeholder="+1 234 567 8900"
            {...register("businessPhone")}
            disabled={isLoading}
          />
          {errors.businessPhone && (
            <p className="text-sm text-red-500">
              {errors.businessPhone.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessEmail">Business Email</Label>
          <Input
            id="businessEmail"
            type="email"
            placeholder="contact@mybusiness.com"
            {...register("businessEmail")}
            disabled={isLoading}
          />
          {errors.businessEmail && (
            <p className="text-sm text-red-500">
              {errors.businessEmail.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessWhatsapp">WhatsApp Number</Label>
          <Input
            id="businessWhatsapp"
            type="tel"
            placeholder="+1 234 567 8900"
            {...register("businessWhatsapp")}
            disabled={isLoading}
          />
          {errors.businessWhatsapp && (
            <p className="text-sm text-red-500">
              {errors.businessWhatsapp.message}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Workspace
      </Button>
    </form>
  );
}
