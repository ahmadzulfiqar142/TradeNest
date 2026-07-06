"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Globe, CheckCircle2, XCircle } from "lucide-react";
import { checkSlugAvailability } from "@/actions/onboarding";
import { type CreateWorkspaceFormValues } from "@/schemas/workspace";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OnboardingStepTwoProps {
  user: { id: string; email?: string };
  workspaceData?: Partial<CreateWorkspaceFormValues>;
  onNext: (data: CreateWorkspaceFormValues) => void;
  onBack: () => void;
  onTriggerSubmit?: (fn: () => void) => void;
}

export function OnboardingStepTwo({
  user,
  workspaceData,
  onNext,
  onBack,
  onTriggerSubmit,
}: OnboardingStepTwoProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(2, "Business name must be at least 2 characters"),
        slug: z
          .string()
          .min(2, "Slug must be at least 2 characters")
          .max(50, "Slug must be less than 50 characters")
          .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
          .refine((slug: string) => !slug.startsWith("-") && !slug.endsWith("-"), {
            message: "Slug cannot start or end with a hyphen",
          }),
      }),
    ),
    defaultValues: {
      name: workspaceData?.name || "",
      slug: workspaceData?.slug || "",
    },
  });

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const checkSlug = (slug: string) => {
    if (!slug || slug.length < 2) { setSlugStatus("idle"); return; }
    setSlugStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { available } = await checkSlugAvailability(slug);
      setSlugStatus(available ? "available" : "taken");
    }, 400);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue("name", name);
    const slug = generateSlug(name);
    setValue("slug", slug);
    checkSlug(slug);
  };

  const onSubmit = async (data: { name: string; slug: string }) => {
    if (slugStatus === "taken" || slugStatus === "checking") return;
    onNext(data as CreateWorkspaceFormValues);
  };

  const handleNextClick = async () => {
    const isValid = await trigger();
    if (isValid) {
      if (slugStatus === "taken" || slugStatus === "checking") return;
      await onSubmit(watch());
    }
  };

  useEffect(() => {
    if (onTriggerSubmit) onTriggerSubmit(handleNextClick);
  }, [onTriggerSubmit, handleNextClick]);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
          <Building2 className="h-8 w-8 text-primary-foreground" />
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="rounded-2xl border border-border bg-card p-8 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Green Valley Store"
                {...register("name")}
                onChange={handleNameChange}
                className="h-14"
              />
              {errors.name && (
                <p className="text-sm text-destructive font-medium">{errors.name.message}</p>
              )}
              {slugStatus === "taken" && (
                <p className="text-sm text-destructive font-medium flex items-center gap-1.5">
                  <XCircle className="h-4 w-4" /> A workspace with that name already exists.
                </p>
              )}
              {slugStatus === "available" && (
                <p className="text-sm text-green-600 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> This workspace name is available.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm font-semibold text-foreground">
                Workspace URL <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-4 h-14 min-w-fit">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    yoursite.com/
                  </span>
                </div>
                <Input
                  id="slug"
                  type="text"
                  placeholder="green-valley"
                  {...register("slug")}
                  className="flex-1 h-14"
                />
              </div>
              {errors.slug && (
                <p className="text-sm text-destructive font-medium">{errors.slug.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Your unique workspace identifier (letters, numbers, hyphens only)
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
