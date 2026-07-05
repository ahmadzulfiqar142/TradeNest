"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/supabase/server";
import { createPaymentSchema, updatePaymentSchema } from "@/schemas/payment";

export type PaymentActionState = {
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

async function updateSaleStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  saleId: string,
  workspaceId: string,
) {
  const { data: sale } = await supabase
    .from("sales")
    .select("total")
    .eq("id", saleId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!sale) return;

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("sale_id", saleId)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null);

  const totalPaid = (payments ?? []).reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );

  const saleTotal = Number(sale.total);
  const paidAmount = Math.min(totalPaid, saleTotal);
  const remainingAmount = Math.max(0, saleTotal - totalPaid);

  const status =
    totalPaid <= 0
      ? "pending"
      : totalPaid >= saleTotal
        ? "paid"
        : "partially_paid";

  await supabase
    .from("sales")
    .update({
      status,
      paid_amount: paidAmount,
      remaining_amount: remainingAmount,
    })
    .eq("id", saleId)
    .eq("workspace_id", workspaceId);
}

export async function createPayment(
  workspaceId: string,
  _previousState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const parsed = createPaymentSchema.safeParse({
    customerId: formData.get("customerId")?.toString() || "",
    saleId: formData.get("saleId")?.toString() || null,
    amount: parseFloat(formData.get("amount")?.toString() || "0"),
    paymentMethod: formData.get("paymentMethod")?.toString() || "",
    paymentDate: formData.get("paymentDate")?.toString() || "",
    referenceNumber: formData.get("referenceNumber")?.toString() || null,
    notes: formData.get("notes")?.toString() || null,
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Check the details and try again.",
      success: false,
    };
  }

  const { supabase, user, error } = await getAuthorizedUser(workspaceId);
  if (error || !user) return { message: error ?? "Unauthorized", success: false };

  const v = parsed.data;

  const { data: newPayment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      workspace_id: workspaceId,
      customer_id: v.customerId,
      sale_id: v.saleId ?? null,
      amount: v.amount,
      payment_method: v.paymentMethod,
      payment_date: v.paymentDate,
      reference_number: v.referenceNumber ?? null,
      notes: v.notes ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (paymentError || !newPayment) {
    return { message: paymentError?.message || "Failed to create payment", success: false };
  }

  // Ledger: debit = money received from customer
  await supabase.rpc("update_customer_ledger", {
    p_customer_id: v.customerId,
    p_workspace_id: workspaceId,
    p_transaction_type: "payment",
    p_reference_type: "payment",
    p_reference_id: newPayment.id,
    p_debit: v.amount,
    p_credit: 0,
    p_description: v.saleId ? "Payment received for invoice" : "Advance payment received",
  });

  // Update sale status if linked to a sale
  if (v.saleId) {
    await updateSaleStatus(supabase, v.saleId, workspaceId);
  }

  revalidatePath("/payments");
  revalidatePath(`/customers/${v.customerId}`);
  revalidatePath("/");

  return { message: "Payment created successfully", success: true };
}

export async function updatePayment(
  workspaceId: string,
  paymentId: string,
  _previousState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const parsed = updatePaymentSchema.safeParse({
    customerId: formData.get("customerId")?.toString() || "",
    saleId: formData.get("saleId")?.toString() || null,
    amount: parseFloat(formData.get("amount")?.toString() || "0"),
    paymentMethod: formData.get("paymentMethod")?.toString() || "",
    paymentDate: formData.get("paymentDate")?.toString() || "",
    referenceNumber: formData.get("referenceNumber")?.toString() || null,
    notes: formData.get("notes")?.toString() || null,
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Check the details and try again.",
      success: false,
    };
  }

  const { supabase, user, error } = await getAuthorizedUser(workspaceId);
  if (error || !user) return { message: error ?? "Unauthorized", success: false };

  const v = parsed.data;

  const { data: existing } = await supabase
    .from("payments")
    .select("id, sale_id")
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .single();

  if (!existing) return { message: "Payment not found", success: false };

  const { error: updateError } = await supabase
    .from("payments")
    .update({
      customer_id: v.customerId,
      sale_id: v.saleId ?? null,
      amount: v.amount,
      payment_method: v.paymentMethod,
      payment_date: v.paymentDate,
      reference_number: v.referenceNumber ?? null,
      notes: v.notes ?? null,
    })
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId);

  if (updateError) return { message: updateError.message, success: false };

  // Update ledger entry
  await supabase
    .from("customer_ledger")
    .update({
      debit: v.amount,
      credit: 0,
      description: v.saleId ? "Payment received for invoice" : "Advance payment received",
    })
    .eq("reference_type", "payment")
    .eq("reference_id", paymentId)
    .eq("workspace_id", workspaceId);

  // Update sale status for old and new sale_id
  const saleIds = [existing.sale_id, v.saleId].filter(Boolean) as string[];
  for (const saleId of [...new Set(saleIds)]) {
    await updateSaleStatus(supabase, saleId, workspaceId);
  }

  revalidatePath("/payments");
  revalidatePath(`/payments/${paymentId}`);
  revalidatePath(`/customers/${v.customerId}`);
  revalidatePath("/");

  return { message: "Payment updated successfully", success: true };
}

export async function deletePayment(
  workspaceId: string,
  paymentId: string,
): Promise<PaymentActionState> {
  const { supabase, user, error } = await getAuthorizedUser(workspaceId);
  if (error || !user) return { message: error ?? "Unauthorized", success: false };

  const { data: existing } = await supabase
    .from("payments")
    .select("customer_id, sale_id")
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .single();

  if (!existing) return { message: "Payment not found", success: false };

  const { error: deleteError } = await supabase
    .from("payments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId);

  if (deleteError) return { message: deleteError.message, success: false };

  // Remove the ledger entry for this payment entirely
  await supabase
    .from("customer_ledger")
    .delete()
    .eq("reference_type", "payment")
    .eq("reference_id", paymentId)
    .eq("workspace_id", workspaceId);

  if (existing.sale_id) {
    await updateSaleStatus(supabase, existing.sale_id, workspaceId);
  }

  revalidatePath("/payments");
  revalidatePath(`/customers/${existing.customer_id}`);
  revalidatePath("/");

  return { message: "Payment deleted successfully", success: true };
}

export async function getPayments(
  workspaceId: string,
  options?: {
    customerId?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  },
) {
  const supabase = await createClient();

  let query = supabase
    .from("payments")
    .select(`*, customers(id, first_name, last_name, phone)`)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("payment_date", { ascending: false });

  if (options?.customerId) query = query.eq("customer_id", options.customerId);
  if (options?.paymentMethod) query = query.eq("payment_method", options.paymentMethod);
  if (options?.startDate) query = query.gte("payment_date", options.startDate);
  if (options?.endDate) query = query.lte("payment_date", options.endDate);

  const { data: payments, error } = await query;

  if (error) return { payments: [], error: error.message };
  return { payments: payments ?? [], error: null };
}

export async function getCustomersForPayment(workspaceId: string) {
  const supabase = await createClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("first_name", { ascending: true });

  if (error) return { customers: [], error: error.message };
  return { customers: customers ?? [], error: null };
}

export async function getOpenSalesForCustomer(
  workspaceId: string,
  customerId: string,
) {
  const supabase = await createClient();

  const { data: sales, error } = await supabase
    .from("sales")
    .select("id, invoice_number, total, status")
    .eq("workspace_id", workspaceId)
    .eq("customer_id", customerId)
    .in("status", ["pending", "partially_paid"])
    .order("sale_date", { ascending: false });

  if (error) return { sales: [], error: error.message };
  return { sales: sales ?? [], error: null };
}

export async function getPaymentDetails(workspaceId: string, paymentId: string) {
  const supabase = await createClient();

  const { data: payment, error } = await supabase
    .from("payments")
    .select(`*, customers(id, first_name, last_name, phone)`)
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .single();

  if (error || !payment) return { payment: null, error: "Payment not found" };
  return { payment, error: null };
}
