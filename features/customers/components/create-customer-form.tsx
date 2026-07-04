"use client";

import { useActionState } from "react";
import { Plus, Save } from "lucide-react";
import {
  createCustomer,
  updateCustomer,
  type CustomerActionState,
} from "@/actions/customer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

const initialCustomerActionState: CustomerActionState = {
  message: "",
  success: false,
};

export function CreateCustomerForm({
  workspaceId,
  mode = "create",
  customer,
}: CreateCustomerFormProps) {
  const customerAction =
    mode === "edit" && customer
      ? updateCustomer.bind(null, workspaceId, customer.id)
      : createCustomer.bind(null, workspaceId);
  const [state, formAction, pending] = useActionState(
    customerAction,
    initialCustomerActionState,
  );
  const isEditMode = mode === "edit";

  // Split full name into first and last for the form
  const firstName = customer?.first_name ?? "";
  const lastName = customer?.last_name ?? "";

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="firstName"
            className="text-sm font-medium text-foreground"
          >
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            defaultValue={firstName}
            placeholder="Enter first name"
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          />
        </div>

        {/* Last Name */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="lastName"
            className="text-sm font-medium text-foreground"
          >
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            defaultValue={lastName}
            placeholder="Enter last name"
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="phone"
            className="text-sm font-medium text-foreground"
          >
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            defaultValue={customer?.phone ?? ""}
            placeholder="Enter phone number"
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          />
        </div>
      </div>

      {/* Address */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="address"
          className="text-sm font-medium text-foreground"
        >
          Address
        </label>
        <input
          type="text"
          id="address"
          name="address"
          defaultValue={customer?.address ?? ""}
          placeholder="Street address"
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
      </div>

      {/* City */}
      <div className="flex flex-col gap-2">
        <label htmlFor="city" className="text-sm font-medium text-foreground">
          City
        </label>
        <input
          type="text"
          id="city"
          name="city"
          defaultValue={customer?.city ?? ""}
          placeholder="City"
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className="text-sm font-medium text-foreground">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={customer?.notes ?? ""}
          placeholder="Additional notes"
          rows={3}
          maxLength={500}
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => {
            const form = document.querySelector("form");
            if (form) form.reset();
          }}
          className="px-6 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
        >
          Reset
        </button>
        <Button type="submit" disabled={pending} className="px-6 py-2">
          {isEditMode ? (
            <>
              <Save className="h-4 w-4" />
              {pending ? "Saving..." : "Save changes"}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              {pending ? "Creating..." : "Add Customer"}
            </>
          )}
        </Button>
      </div>

      {state.message ? (
        <p
          className={
            state.success
              ? "text-sm font-medium text-green-400"
              : "text-sm font-medium text-red-400"
          }
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
