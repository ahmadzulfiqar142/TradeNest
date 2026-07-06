"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";
import { createCustomer, updateCustomer } from "@/actions/customer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  const { success, error } = useToast();
  const isEditMode = mode === "edit";

  const form = useForm<CreateCustomerFormValues>({
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

  const onSubmit = async (data: CreateCustomerFormValues) => {
    const result =
      isEditMode && customer
        ? await updateCustomer(workspaceId, customer.id, data)
        : await createCustomer(workspaceId, data);

    if (result.success) {
      success(result.message);
      router.push("/customers");
    } else {
      error(result.message);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter first name"
                        {...field}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter last name"
                        {...field}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="Enter phone number"
                        {...field}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Street address"
                      {...field}
                      value={field.value || ""}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="City"
                      {...field}
                      value={field.value || ""}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes"
                      rows={3}
                      maxLength={500}
                      {...field}
                      value={field.value || ""}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEditMode ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {form.formState.isSubmitting ? "Saving..." : "Save changes"}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {form.formState.isSubmitting
                      ? "Creating..."
                      : "Add Customer"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
