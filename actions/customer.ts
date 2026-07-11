"use server";

import { revalidatePath } from "next/cache";
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
  data: import("@/schemas/customer").CreateCustomerFormValues,
): Promise<CustomerActionState> {
  const parsed = createCustomerSchema.safeParse(data);

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

  // Check if customer with this phone number already exists in the workspace
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id, first_name, last_name")
    .eq("workspace_id", workspaceId)
    .eq("phone", values.phone)
    .maybeSingle();

  if (existingCustomer) {
    return {
      message: `A customer with this phone number already exists: ${existingCustomer.first_name} ${existingCustomer.last_name}`,
      success: false,
    };
  }

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

  return { message: "Customer created successfully", success: true };
}

export async function updateCustomer(
  workspaceId: string,
  customerId: string,
  data: import("@/schemas/customer").CreateCustomerFormValues,
): Promise<CustomerActionState> {
  const parsed = createCustomerSchema.safeParse(data);

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

  // Check if another customer with this phone number already exists in the workspace
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id, first_name, last_name")
    .eq("workspace_id", workspaceId)
    .eq("phone", values.phone)
    .neq("id", customerId)
    .maybeSingle();

  if (existingCustomer) {
    return {
      message: `Another customer with this phone number already exists: ${existingCustomer.first_name} ${existingCustomer.last_name}`,
      success: false,
    };
  }

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

  return { message: "Customer updated successfully", success: true };
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
      "id, invoice_number, total, paid_amount, remaining_amount, sale_date, payment_status, status",
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
      "id, amount, payment_method, payment_date, sale_id, reference_number, notes, created_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("payment_date", { ascending: false });

  // Get ledger entries (ascending for running balance)
  const { data: ledger } = await supabase
    .from("customer_ledger")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("customer_id", customerId)
    .order("transaction_date", { ascending: true });

  // Build a sale-id → invoice_number lookup
  const saleMap = new Map((sales ?? []).map((s) => [s.id, s.invoice_number]));

  // Calculate financial summary (sales-first architecture)
  const totalSales =
    sales?.reduce((sum, sale) => sum + Number(sale.total), 0) ?? 0;

  // Only count unlinked payments (sale_id IS NULL) as advance payments
  // Payments linked to sales are already accounted for in totalSales
  const advancePayments =
    payments
      ?.filter((p) => p.sale_id === null)
      .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  // Total of all payments linked to sales (excludes unlinked advance payments
  // to avoid double-counting — advance balance is shown separately)
  const totalPayments =
    payments
      ?.filter((p) => p.sale_id !== null)
      .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  // Outstanding = sales - all payments (when sales > payments)
  // Advance = remaining credit after using advance for sales
  const diff = totalPayments - totalSales;
  const outstandingBalance = diff < 0 ? Math.abs(diff) : 0;
  const advanceBalance = advancePayments;

  // Shape invoices
  const invoices = (sales ?? []).map((sale) => ({
    id: sale.id,
    invoiceNumber: sale.invoice_number,
    saleDate: sale.sale_date,
    items: (saleItems ?? [])
      .filter((i) => i.sale_id === sale.id)
      .map((i) => ({ productName: i.product_name, quantity: i.quantity })),
    total: Number(sale.total),
    paidAmount: Number(sale.paid_amount),
    remainingAmount: Number(sale.remaining_amount),
    status: (sale.status ?? sale.payment_status ?? "pending") as
      | "pending"
      | "partially_paid"
      | "paid"
      | "cancelled",
  }));

  // Shape payments — no product fields
  const paymentHistory = (payments ?? []).map((p) => ({
    id: p.id,
    receiptNumber: p.reference_number ?? null,
    paymentDate: p.payment_date,
    amount: Number(p.amount),
    paymentMethod: p.payment_method,
    saleId: p.sale_id ?? null,
    invoiceNumber: p.sale_id ? (saleMap.get(p.sale_id) ?? null) : null,
  }));

  // Shape ledger entries
  const ledgerEntries = (ledger ?? []).map((entry) => {
    const rawType = entry.transaction_type?.toUpperCase() ?? "";
    const type = (
      ["SALE", "PAYMENT", "ADVANCE", "REFUND", "ADJUSTMENT"] as const
    ).includes(
      rawType as "SALE" | "PAYMENT" | "ADVANCE" | "REFUND" | "ADJUSTMENT",
    )
      ? (rawType as "SALE" | "PAYMENT" | "ADVANCE" | "REFUND" | "ADJUSTMENT")
      : "ADJUSTMENT";
    return {
      id: entry.id,
      date: entry.transaction_date,
      type,
      reference: entry.description,
      description: entry.description,
      debit: Number(entry.debit),
      credit: Number(entry.credit),
      balance: Number(entry.balance),
    };
  });

  return {
    customer,
    invoices,
    paymentHistory,
    ledger: ledgerEntries,
    summary: {
      totalSales,
      totalPayments,
      outstandingBalance,
      advanceBalance,
      totalInvoices: invoices.length,
      totalPaymentsReceived: paymentHistory.length,
      lastSaleDate: sales?.[0]?.sale_date ?? null,
      lastPaymentDate: payments?.[0]?.payment_date ?? null,
    },
    currency,
    currencySymbol,
    error: null,
  };
}
