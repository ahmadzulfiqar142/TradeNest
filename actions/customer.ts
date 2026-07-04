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
  const parsed = createCustomerSchema.safeParse({
    firstName: formData.get("firstName")?.toString() || "",
    lastName: formData.get("lastName")?.toString() || "",
    phone: formData.get("phone")?.toString() || "",
    address: formData.get("address")?.toString(),
    city: formData.get("city")?.toString(),
    notes: formData.get("notes")?.toString(),
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
    first_name: values.firstName,
    last_name: values.lastName,
    phone: values.phone,
    address: values.address,
    city: values.city,
    notes: values.notes,
    status: "Active",
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
  const parsed = createCustomerSchema.safeParse({
    firstName: formData.get("firstName")?.toString() || "",
    lastName: formData.get("lastName")?.toString() || "",
    phone: formData.get("phone")?.toString() || "",
    address: formData.get("address")?.toString(),
    city: formData.get("city")?.toString(),
    notes: formData.get("notes")?.toString(),
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
      first_name: values.firstName,
      last_name: values.lastName,
      phone: values.phone,
      address: values.address,
      city: values.city,
      notes: values.notes,
    })
    .eq("id", customerId)
    .eq("workspace_id", workspaceId);

  if (customerError) {
    return { message: customerError.message, success: false };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}/edit`);
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/");

  redirect("/customers");
}

export async function deleteCustomer(
  workspaceId: string,
  customerId: string,
): Promise<CustomerActionState> {
  const { supabase, user, error } = await getAuthorizedUser(workspaceId);

  if (error || !user) {
    return { message: error ?? "Unauthorized", success: false };
  }

  const { error: customerError } = await supabase
    .from("customers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", customerId)
    .eq("workspace_id", workspaceId);

  if (customerError) {
    return { message: customerError.message, success: false };
  }

  revalidatePath("/customers");
  revalidatePath("/");

  return { message: "Customer deleted successfully", success: true };
}

export async function archiveCustomer(
  workspaceId: string,
  customerId: string,
): Promise<CustomerActionState> {
  const { supabase, user, error } = await getAuthorizedUser(workspaceId);

  if (error || !user) {
    return { message: error ?? "Unauthorized", success: false };
  }

  const { error: customerError } = await supabase
    .from("customers")
    .update({ status: "Inactive" })
    .eq("id", customerId)
    .eq("workspace_id", workspaceId);

  if (customerError) {
    return { message: customerError.message, success: false };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/");

  return { message: "Customer archived successfully", success: true };
}

export async function getCustomerDetails(
  workspaceId: string,
  customerId: string,
) {
  const supabase = await createClient();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", customerId)
    .single();

  if (customerError || !customer) {
    return { customer: null, error: "Customer not found" };
  }

  // Get workspace currency
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("currency")
    .eq("id", workspaceId)
    .single();

  const currency = workspace?.currency || "USD";
  const currencySymbol = currency === "PKR" ? "Rs" : "$";

  // Get sales data
  const { data: sales } = await supabase
    .from("sales")
    .select(
      "id, invoice_number, total, paid_amount, remaining_amount, sale_date, payment_status",
    )
    .eq("workspace_id", workspaceId)
    .eq("customer_id", customerId)
    .order("sale_date", { ascending: false });

  // Get sale items with product details
  const { data: saleItems } = await supabase
    .from("sale_items")
    .select(
      `
      id,
      sale_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      discount,
      total,
      created_at,
      sales!inner(sale_date, invoice_number)
    `,
    )
    .in(
      "sale_id",
      (sales ?? []).map((s) => s.id),
    )
    .order("created_at", { ascending: false });

  // Get payments
  const { data: payments } = await supabase
    .from("payments")
    .select(
      "id, amount, payment_method, payment_date, notes, created_at, reference_type, reference_id",
    )
    .eq("workspace_id", workspaceId)
    .eq("reference_type", "customer")
    .eq("reference_id", customerId)
    .order("payment_date", { ascending: false });

  // Get ledger entries
  const { data: ledger } = await supabase
    .from("customer_ledger")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("customer_id", customerId)
    .order("transaction_date", { ascending: true });

  // Calculate financial summary
  const totalPurchases =
    sales?.reduce((sum, sale) => sum + Number(sale.total), 0) ?? 0;
  const totalPaid =
    payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) ?? 0;
  const remainingBalance = totalPurchases - totalPaid;
  const pendingAmount =
    sales
      ?.filter(
        (sale) =>
          sale.payment_status === "pending" ||
          sale.payment_status === "partial",
      )
      .reduce((sum, sale) => sum + Number(sale.remaining_amount), 0) ?? 0;
  const totalOrders = sales?.length ?? 0;
  const lastPurchaseDate = sales?.[0]?.sale_date ?? null;
  const lastPaymentDate = payments?.[0]?.payment_date ?? null;

  return {
    customer,
    sales: sales ?? [],
    saleItems: saleItems ?? [],
    payments: payments ?? [],
    ledger: ledger ?? [],
    summary: {
      totalPurchases,
      totalPaid,
      remainingBalance,
      pendingAmount,
      totalOrders,
      lastPurchaseDate,
      lastPaymentDate,
    },
    currency,
    currencySymbol,
    error: null,
  };
}
