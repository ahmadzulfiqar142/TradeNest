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
    name: string;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    id_number: string | null;
    credit_limit: number;
    opening_balance: number;
    notes: string | null;
    is_active: boolean | null;
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
  const fullName = customer?.name ?? "";
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

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

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={customer?.email ?? ""}
            placeholder="customer@example.com"
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
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            defaultValue={customer?.phone ?? ""}
            placeholder="+1 (555) 000-0000"
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        {/* Company */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="company"
            className="text-sm font-medium text-foreground"
          >
            Company
          </label>
          <input
            type="text"
            id="company"
            name="company"
            placeholder="Company name"
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        {/* Customer Type */}
        <div className="flex flex-col gap-2">
          <label htmlFor="type" className="text-sm font-medium text-foreground">
            Customer Type
          </label>
          <select
            id="type"
            name="type"
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="individual">Individual</option>
            <option value="business">Business</option>
            <option value="enterprise">Enterprise</option>
          </select>
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

      {/* City & Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div className="flex flex-col gap-2">
          <label
            htmlFor="country"
            className="text-sm font-medium text-foreground"
          >
            Country
          </label>
          <input
            type="text"
            id="country"
            name="country"
            defaultValue={customer?.country ?? ""}
            placeholder="Country"
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
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
