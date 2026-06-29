"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building2, Globe, MapPin, Phone, Mail, MessageSquare, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { createWorkspaceOnboarding } from "@/actions/onboarding";
import {
  createWorkspaceSchema,
  type CreateWorkspaceFormValues,
} from "@/schemas/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OnboardingStepTwoProps {
  user: {
    id: string;
    email?: string;
  };
  onNext: (data: any) => void;
  onBack: () => void;
}

export function OnboardingStepTwo({ user, onNext, onBack }: OnboardingStepTwoProps) {
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
      const result = await createWorkspaceOnboarding(data);
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else if (result?.success) {
        onNext(data);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-lg shadow-[#2563EB]/30">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-4xl font-bold text-[#0F172A] tracking-tight">
            Create Your Workspace
          </h2>
          <p className="mt-3 text-lg text-[#64748B]">
            Set up your business in just a few steps
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Business Information Card */}
        <div className="rounded-2xl border border-[#D9D9D9] bg-white p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]">
              <Building2 className="h-6 w-6 text-[#2563EB]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0F172A]">
                Business Details
              </h3>
              <p className="text-sm text-[#64748B]">Tell us about your business</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-[#0F172A]">
                Business Name <span className="text-[#EF4444]">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Green Valley Store"
                {...register("name")}
                onChange={handleNameChange}
                disabled={isLoading}
                className="h-14"
              />
              {errors.name && (
                <p className="text-sm text-[#EF4444] font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* Workspace URL */}
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm font-semibold text-[#0F172A]">
                Workspace URL <span className="text-[#EF4444]">*</span>
              </Label>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-[#D9D9D9] bg-[#F8FAFC] px-4 h-14 min-w-fit">
                  <Globe className="h-5 w-5 text-[#64748B]" />
                  <span className="text-sm font-medium text-[#64748B] whitespace-nowrap">yoursite.com/</span>
                </div>
                <Input
                  id="slug"
                  type="text"
                  placeholder="green-valley"
                  {...register("slug")}
                  disabled={isLoading}
                  className="flex-1 h-14"
                />
              </div>
              {errors.slug && (
                <p className="text-sm text-[#EF4444] font-medium">{errors.slug.message}</p>
              )}
              <p className="text-xs text-[#94A3B8]">
                Your unique workspace identifier (letters, numbers, hyphens only)
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="rounded-2xl border border-[#D9D9D9] bg-white p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7]">
              <Phone className="h-6 w-6 text-[#22C55E]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0F172A]">
                Contact Information
              </h3>
              <p className="text-sm text-[#64748B]">Optional - can be added later</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Business Address */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="businessAddress" className="text-sm font-semibold text-[#0F172A]">
                Business Address
              </Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" />
                <Input
                  id="businessAddress"
                  type="text"
                  placeholder="123 Main St, City, State 12345"
                  {...register("businessAddress")}
                  disabled={isLoading}
                  className="pl-12 h-14"
                />
              </div>
            </div>

            {/* Business Phone */}
            <div className="space-y-2">
              <Label htmlFor="businessPhone" className="text-sm font-semibold text-[#0F172A]">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" />
                <Input
                  id="businessPhone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  {...register("businessPhone")}
                  disabled={isLoading}
                  className="pl-12 h-14"
                />
              </div>
            </div>

            {/* Business Email */}
            <div className="space-y-2">
              <Label htmlFor="businessEmail" className="text-sm font-semibold text-[#0F172A]">
                Business Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" />
                <Input
                  id="businessEmail"
                  type="email"
                  placeholder="contact@business.com"
                  {...register("businessEmail")}
                  disabled={isLoading}
                  className="pl-12 h-14"
                />
              </div>
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="businessWhatsapp" className="text-sm font-semibold text-[#0F172A]">
                WhatsApp Number
              </Label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" />
                <Input
                  id="businessWhatsapp"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  {...register("businessWhatsapp")}
                  disabled={isLoading}
                  className="pl-12 h-14"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl border border-[#FEE2E2] bg-[#FEF2F2] p-5">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#EF4444]">
                <span className="text-xs font-bold text-white">!</span>
              </div>
              <div>
                <p className="font-semibold text-[#0F172A]">Unable to create workspace</p>
                <p className="text-sm text-[#64748B] mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            size="lg"
            className="h-14 px-8"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="h-14 px-10 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] shadow-lg shadow-[#2563EB]/30"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create Workspace
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
