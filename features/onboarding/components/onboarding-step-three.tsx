"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Phone, Mail, MessageSquare } from "lucide-react";
import {
  createWorkspaceSchema,
  type CreateWorkspaceFormValues,
} from "@/schemas/workspace";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OnboardingStepThreeProps {
  user: {
    id: string;
    email?: string;
  };
  workspaceData: Partial<CreateWorkspaceFormValues>;
  onNext: (data: CreateWorkspaceFormValues) => void;
  onBack: () => void;
  onTriggerSubmit?: (fn: () => void) => void;
}

export function OnboardingStepThree({
  user,
  workspaceData,
  onNext,
  onBack,
  onTriggerSubmit,
}: OnboardingStepThreeProps) {

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: workspaceData.name || "",
      slug: workspaceData.slug || "",
      businessAddress: workspaceData.businessAddress || "",
      businessPhone: workspaceData.businessPhone || "",
      businessEmail: workspaceData.businessEmail || "",
      businessWhatsapp: workspaceData.businessWhatsapp || "",
    },
  });

  const onSubmit = (data: CreateWorkspaceFormValues) => {
    onNext(data);
  };

  // Handle Next button click from parent
  const handleNextClick = async () => {
    // Validate the form first
    const isValid = await trigger();
    if (isValid) {
      // Get the form data
      const data = watch();
      // Call onSubmit with the data
      await onSubmit(data);
    }
  };

  // Expose handleNextClick to parent
  useEffect(() => {
    if (onTriggerSubmit) {
      onTriggerSubmit(handleNextClick);
    }
  }, [onTriggerSubmit, handleNextClick]);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-lg shadow-[#2563EB]/30">
          <Phone className="h-8 w-8 text-white" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Hidden fields to preserve workspace data from step 2 */}
        <input type="hidden" {...register("name")} />
        <input type="hidden" {...register("slug")} />
        {/* Contact Information Card */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7]">
              <Phone className="h-6 w-6 text-[#22C55E]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Business Contact Details
              </h3>
              <p className="text-sm text-slate-400">Help customers reach you</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Business Address */}
            <div className="space-y-2 md:col-span-2">
              <Label
                htmlFor="businessAddress"
                className="text-sm font-semibold text-slate-200"
              >
                Business Address
              </Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <Input
                  id="businessAddress"
                  type="text"
                  placeholder="123 Main St, City, State 12345"
                  {...register("businessAddress")}
                  className="pl-12 h-14 bg-slate-900 border-slate-600 text-slate-100 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Business Phone */}
            <div className="space-y-2">
              <Label
                htmlFor="businessPhone"
                className="text-sm font-semibold text-slate-200"
              >
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <Input
                  id="businessPhone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  {...register("businessPhone")}
                  className="pl-12 h-14 bg-slate-900 border-slate-600 text-slate-100 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Business Email */}
            <div className="space-y-2">
              <Label
                htmlFor="businessEmail"
                className="text-sm font-semibold text-slate-200"
              >
                Business Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <Input
                  id="businessEmail"
                  type="email"
                  placeholder="contact@business.com"
                  {...register("businessEmail")}
                  className="pl-12 h-14 bg-slate-900 border-slate-600 text-slate-100 placeholder-slate-500"
                />
              </div>
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-2 md:col-span-2">
              <Label
                htmlFor="businessWhatsapp"
                className="text-sm font-semibold text-slate-200"
              >
                WhatsApp Number
              </Label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <Input
                  id="businessWhatsapp"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  {...register("businessWhatsapp")}
                  className="pl-12 h-14 bg-slate-900 border-slate-600 text-slate-100 placeholder-slate-500"
                />
              </div>
            </div>
          </div>
        </div>


      </form>
    </div>
  );
}
