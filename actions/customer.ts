"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/supabase/server";
import { createCustomerSchema } from "@/schemas/customer";

export type CustomerActionState = {
  message: string;
  success: boolean;
};

async function getAuthorizedUser(workspaceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, user: null, error: "Unauthorized" };
  }

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return {
      supabase,
      user: null,
      error: "You do not have access to this workspace.",
    };
  }

  return { supabase, user, error: null };
}

export async function createCustomer(
  workspaceId: string,
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const firstName = formData.get("firstName")?.toString() || "";
  const lastName = formData.get("lastName")?.toString() || "";
  const fullName = `${firstName} ${lastName}`.trim();

  const parsed = createCustomerSchema.safeParse({
    name: fullName,
    email: formData.get("email"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    country: formData.get("country"),
    idNumber: formData.get("idNumber"),
    creditLimit: formData.get("creditLimit"),
    openingBalance: formData.get("openingBalance"),
    notes: formData.get("notes"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Check the customer details and try again.",
      success: false,
    };
  }

  const { supabase, user, error } = await getAuthorizedUser(workspaceId);

  if (error || !user) {
    return { message: error ?? "Unauthorized", success: false };
  }

  const values = parsed.data;

  const { error: customerError } = await supabase.from("customers").insert({
    workspace_id: workspaceId,
    name: values.name,
    email: values.email,
    phone: values.phone,
    whatsapp: values.whatsapp,
    address: values.address,
    city: values.city,
    state: values.state,
    country: values.country,
    id_number: values.idNumber,
    credit_limit: values.creditLimit,
    opening_balance: values.openingBalance,
    current_balance: values.openingBalance,
    notes: values.notes,
    is_active: values.isActive,
    created_by: user.id,
    updated_by: user.id,
  });

  if (customerError) {
    return { message: customerError.message, success: false };
  }

  revalidatePath("/customers");
  revalidatePath("/");

  redirect("/customers");
}

export async function updateCustomer(
  workspaceId: string,
  customerId: string,
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const firstName = formData.get("firstName")?.toString() || "";
  const lastName = formData.get("lastName")?.toString() || "";
  const fullName = `${firstName} ${lastName}`.trim();

  const parsed = createCustomerSchema.safeParse({
    name: fullName,
    email: formData.get("email"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    country: formData.get("country"),
    idNumber: formData.get("idNumber"),
    creditLimit: formData.get("creditLimit"),
    openingBalance: formData.get("openingBalance"),
    notes: formData.get("notes"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Check the customer details and try again.",
      success: false,
    };
  }

  const { supabase, user, error } = await getAuthorizedUser(workspaceId);

  if (error || !user) {
    return { message: error ?? "Unauthorized", success: false };
  }

  const values = parsed.data;

  const { error: customerError } = await supabase
    .from("customers")
    .update({
      name: values.name,
      email: values.email,
      phone: values.phone,
      whatsapp: values.whatsapp,
      address: values.address,
      city: values.city,
      state: values.state,
      country: values.country,
      id_number: values.idNumber,
      credit_limit: values.creditLimit,
      opening_balance: values.openingBalance,
      notes: values.notes,
      is_active: values.isActive,
      updated_by: user.id,
    })
    .eq("id", customerId)
    .eq("workspace_id", workspaceId);

  if (customerError) {
    return { message: customerError.message, success: false };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}/edit`);
  revalidatePath("/");

  redirect("/customers");
}
