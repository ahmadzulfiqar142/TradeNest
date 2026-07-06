"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Phone, Mail, MessageSquare } from "lucide-react";
import { createWorkspaceSchema, type CreateWorkspaceFormValues } from "@/schemas/workspace";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OnboardingStepThreeProps {
  user: { id: string; email?: string };
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
  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm<CreateWorkspaceFormValues>({
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

  const onSubmit = (data: CreateWorkspaceFormValues) => onNext(data);

  const handleNextClick = async () => {
    const isValid = await trigger();
    if (isValid) await onSubmit(watch());
  };

  useEffect(() => {
    if (onTriggerSubmit) onTriggerSubmit(handleNextClick);
  }, [onTriggerSubmit, handleNextClick]);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
          <Phone className="h-8 w-8 text-primary-foreground" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <input type="hidden" {...register("name")} />
        <input type="hidden" {...register("slug")} />

        <div className="rounded-2xl border border-border bg-card p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
              <Phone className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Business Contact Details</h3>
              <p className="text-sm text-muted-foreground">Help customers reach you</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="businessAddress" className="text-sm font-semibold text-foreground">
                Business Address
              </Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="businessAddress"
                  type="text"
                  placeholder="123 Main St, City, State 12345"
                  {...register("businessAddress")}
                  className="pl-12 h-14"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessPhone" className="text-sm font-semibold text-foreground">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="businessPhone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  {...register("businessPhone")}
                  className="pl-12 h-14"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessEmail" className="text-sm font-semibold text-foreground">
                Business Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="businessEmail"
                  type="email"
                  placeholder="contact@business.com"
                  {...register("businessEmail")}
                  className="pl-12 h-14"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="businessWhatsapp" className="text-sm font-semibold text-foreground">
                WhatsApp Number
              </Label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="businessWhatsapp"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  {...register("businessWhatsapp")}
                  className="pl-12 h-14"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
