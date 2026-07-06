"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";
import { createCustomer, updateCustomer } from "@/actions/customer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  createCustomerSchema,
  type CreateCustomerFormValues,
} from "@/schemas/customer";

type CreateCustomerFormProps = {
  workspaceId: string;
  mode?: "create" | "edit";
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    address: string | null;
    city: string | null;
    notes: string | null;
    status: string;
  };
};

export function CreateCustomerForm({
  workspaceId,
  mode = "create",
  customer,
}: CreateCustomerFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();
  const isEditMode = mode === "edit";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      firstName: customer?.first_name ?? "",
      lastName: customer?.last_name ?? "",
      phone: customer?.phone ?? "",
      address: customer?.address ?? undefined,
      city: customer?.city ?? undefined,
      notes: customer?.notes ?? undefined,
    },
  });

  const onSubmit = (data: CreateCustomerFormValues) => {
    const formData = new FormData();
    formData.append("firstName", data.firstName);
    formData.append("lastName", data.lastName);
    formData.append("phone", data.phone);
    if (data.address) formData.append("address", data.address);
    if (data.city) formData.append("city", data.city);
    if (data.notes) formData.append("notes", data.notes);

    startTransition(async () => {
      const result =
        isEditMode && customer
          ? await updateCustomer(workspaceId, customer.id, { message: "", success: false }, formData)
          : await createCustomer(workspaceId, { message: "", success: false }, formData);

      if (result.success) {
        success(result.message);
        router.push("/customers");
      } else {
        error(result.message);
      }
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                First Name *
              </Label>
              <Input
                id="firstName"
                {...register("firstName")}
                placeholder="Enter first name"
                className={errors.firstName ? "border-red-500" : ""}
                disabled={pending}
              />
              {errors.firstName && (
                <p className="text-xs text-red-400">{errors.firstName.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                Last Name *
              </Label>
              <Input
                id="lastName"
                {...register("lastName")}
                placeholder="Enter last name"
                className={errors.lastName ? "border-red-500" : ""}
                disabled={pending}
              />
              {errors.lastName && (
                <p className="text-xs text-red-400">{errors.lastName.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="Enter phone number"
                className={errors.phone ? "border-red-500" : ""}
                disabled={pending}
              />
              {errors.phone && (
                <p className="text-xs text-red-400">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="address" className="text-sm font-medium text-foreground">
              Address
            </Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="Street address"
              className={errors.address ? "border-red-500" : ""}
              disabled={pending}
            />
            {errors.address && (
              <p className="text-xs text-red-400">{errors.address.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="city" className="text-sm font-medium text-foreground">
              City
            </Label>
            <Input
              id="city"
              {...register("city")}
              placeholder="City"
              className={errors.city ? "border-red-500" : ""}
              disabled={pending}
            />
            {errors.city && (
              <p className="text-xs text-red-400">{errors.city.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes" className="text-sm font-medium text-foreground">
              Notes
            </Label>
            <textarea
              id="notes"
              {...register("notes")}
              placeholder="Additional notes"
              rows={3}
              maxLength={500}
              className={`px-4 py-2 border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                errors.notes ? "border-red-500" : "border-border"
              }`}
              disabled={pending}
            />
            {errors.notes && (
              <p className="text-xs text-red-400">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={pending}
              className="px-6 py-2"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="px-6 py-2">
              {isEditMode ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {pending ? "Saving..." : "Save changes"}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {pending ? "Creating..." : "Add Customer"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
