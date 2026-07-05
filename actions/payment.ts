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

export async function createPayment(
  workspaceId: string,
  _previousState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const parsed = createPaymentSchema.safeParse({
    customerId: formData.get("customerId")?.toString() || "",
    amount: parseFloat(formData.get("amount")?.toString() || "0"),
    paymentMethod: formData.get("paymentMethod")?.toString() || "",
    paymentDate: formData.get("paymentDate")?.toString() || "",
    paymentStatus: formData.get("paymentStatus")?.toString() || "pending",
    productId: formData.get("productId")?.toString() || null,
    quantity: parseInt(formData.get("quantity")?.toString() || "1"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Check the payment details and try again.",
      success: false,
    };
  }

  const { supabase, user, error } = await getAuthorizedUser(workspaceId);
  if (error || !user)
    return { message: error ?? "Unauthorized", success: false };

  const values = parsed.data;

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("id", values.customerId)
    .single();

  if (!customer) return { message: "Customer not found", success: false };

  // Build notes from product if selected
  let notes: string | undefined;
  if (values.productId && values.quantity) {
    const { data: product } = await supabase
      .from("products")
      .select("name, selling_price")
      .eq("id", values.productId)
      .eq("workspace_id", workspaceId)
      .single();
    if (product) {
      notes = `Product: ${product.name} (Qty: ${values.quantity} x Rs.${Number(product.selling_price).toFixed(2)})`;
    }
  }

  const { data: newPayment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      workspace_id: workspaceId,
      customer_id: values.customerId,
      amount: values.amount,
      payment_method: values.paymentMethod,
      payment_date: values.paymentDate,
      payment_status: values.paymentStatus,
      notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (paymentError || !newPayment) {
    return {
      message: paymentError?.message || "Failed to create payment",
      success: false,
    };
  }

  // Calculate running balance for ledger
  const { data: existingPayments } = await supabase
    .from("payments")
    .select("amount, deleted_at")
    .eq("workspace_id", workspaceId)
    .eq("customer_id", values.customerId)
    .neq("id", newPayment.id);

  // Filter out deleted payments client-side if column exists
  const filteredExistingPayments =
    existingPayments?.filter(
      (p) => p.deleted_at === null || p.deleted_at === undefined,
    ) || [];

  const totalPaid = filteredExistingPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );

  await supabase.from("customer_ledger").insert({
    workspace_id: workspaceId,
    customer_id: values.customerId,
    transaction_type: "payment",
    reference_type: "payment",
    reference_id: newPayment.id,
    debit: 0,
    credit: values.amount,
    balance: -(totalPaid + values.amount),
    description: "Payment received",
    transaction_date: values.paymentDate,
    created_by: user.id,
  });

  revalidatePath("/payments");
  revalidatePath(`/customers/${values.customerId}`);
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
    amount: parseFloat(formData.get("amount")?.toString() || "0"),
    paymentMethod: formData.get("paymentMethod")?.toString() || "",
    paymentDate: formData.get("paymentDate")?.toString() || "",
    paymentStatus: formData.get("paymentStatus")?.toString() || "pending",
    productId: formData.get("productId")?.toString() || null,
    quantity: parseInt(formData.get("quantity")?.toString() || "1"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Check the payment details and try again.",
      success: false,
    };
  }

  const { supabase, user, error } = await getAuthorizedUser(workspaceId);
  if (error || !user)
    return { message: error ?? "Unauthorized", success: false };

  const values = parsed.data;

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id, customer_id")
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .single();

  if (!existingPayment) return { message: "Payment not found", success: false };

  // Build notes from product if selected
  let notes: string | undefined;
  if (values.productId && values.quantity) {
    const { data: product } = await supabase
      .from("products")
      .select("name, selling_price")
      .eq("id", values.productId)
      .eq("workspace_id", workspaceId)
      .single();
    if (product) {
      notes = `Product: ${product.name} (Qty: ${values.quantity} x Rs.${Number(product.selling_price).toFixed(2)})`;
    }
  }

  const { error: paymentError } = await supabase
    .from("payments")
    .update({
      customer_id: values.customerId,
      amount: values.amount,
      payment_method: values.paymentMethod,
      payment_date: values.paymentDate,
      payment_status: values.paymentStatus,
      notes,
    })
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId);

  if (paymentError) return { message: paymentError.message, success: false };

  // Recalculate running balance for ledger
  const { data: otherPayments } = await supabase
    .from("payments")
    .select("amount, deleted_at")
    .eq("workspace_id", workspaceId)
    .eq("customer_id", values.customerId)
    .neq("id", paymentId);

  // Filter out deleted payments client-side if column exists
  const filteredOtherPayments =
    otherPayments?.filter(
      (p) => p.deleted_at === null || p.deleted_at === undefined,
    ) || [];

  const totalPaid = filteredOtherPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );

  await supabase
    .from("customer_ledger")
    .update({
      credit: values.amount,
      balance: -(totalPaid + values.amount),
      description: "Payment updated",
    })
    .eq("reference_type", "payment")
    .eq("reference_id", paymentId)
    .eq("workspace_id", workspaceId);

  revalidatePath("/payments");
  revalidatePath(`/payments/${paymentId}`);
  revalidatePath(`/customers/${values.customerId}`);
  revalidatePath("/");

  return { message: "Payment updated successfully", success: true };
}

export async function deletePayment(
  workspaceId: string,
  paymentId: string,
): Promise<PaymentActionState> {
  const { supabase, user, error } = await getAuthorizedUser(workspaceId);

  if (error || !user) {
    return { message: error ?? "Unauthorized", success: false };
  }

  // Get existing payment
  const { data: existingPayment, error: fetchError } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId)
    .single();

  // Filter out deleted payments client-side if column exists
  const filteredPayment =
    existingPayment &&
    (existingPayment.deleted_at === null ||
      existingPayment.deleted_at === undefined)
      ? existingPayment
      : null;

  if (fetchError || !filteredPayment) {
    return { message: "Payment not found", success: false };
  }

  // Soft delete payment (only if column exists)
  let deleteError = null;
  try {
    const result = await supabase
      .from("payments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", paymentId)
      .eq("workspace_id", workspaceId);
    deleteError = result.error;
  } catch (error) {
    // Column doesn't exist, skip soft delete
    console.warn("deleted_at column not found, skipping soft delete");
  }

  if (deleteError) {
    return { message: deleteError.message, success: false };
  }

  // Reverse ledger entry
  const { error: ledgerError } = await supabase
    .from("customer_ledger")
    .update({
      credit: 0,
      description: `Payment deleted`,
    })
    .eq("reference_type", "payment")
    .eq("reference_id", paymentId)
    .eq("workspace_id", workspaceId);

  if (ledgerError) {
    console.error("Failed to reverse ledger entry:", ledgerError);
  }

  revalidatePath("/payments");
  revalidatePath(`/customers/${filteredPayment.customer_id}`);
  revalidatePath("/");

  return { message: "Payment deleted successfully", success: true };
}

export async function getPaymentDetails(
  workspaceId: string,
  paymentId: string,
) {
  const supabase = await createClient();

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select(
      `
      *,
      customers (
        id,
        first_name,
        last_name,
        phone
      ),
      products (
        id,
        name,
        selling_price
      )
    `,
    )
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId)
    .single();

  // Filter out deleted payments client-side if column exists
  const filteredPaymentData =
    payment && (payment.deleted_at === null || payment.deleted_at === undefined)
      ? payment
      : null;

  if (paymentError || !filteredPaymentData) {
    return { payment: null, error: "Payment not found" };
  }

  return { payment: filteredPaymentData, error: null };
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
    .select(
      `
      *,
      customers (
        id,
        first_name,
        last_name,
        phone
      )
    `,
    )
    .eq("workspace_id", workspaceId)
    .order("payment_date", { ascending: false });

  // Try to filter by deleted_at if the column exists
  // First, test if the column exists by making a test query
  const { data: testData, error: testError } = await supabase
    .from("payments")
    .select("deleted_at")
    .limit(1);

  const hasDeletedAtColumn =
    !testError || !testError.message.includes("deleted_at");

  if (hasDeletedAtColumn) {
    query = query.is("deleted_at", null);
  } else {
    console.warn("deleted_at column not found, skipping soft delete filter");
  }

  if (options?.customerId) {
    query = query.eq("customer_id", options.customerId);
  }

  if (options?.paymentMethod) {
    query = query.eq("payment_method", options.paymentMethod);
  }

  if (options?.startDate) {
    query = query.gte("payment_date", options.startDate);
  }

  if (options?.endDate) {
    query = query.lte("payment_date", options.endDate);
  }

  if (options?.search) {
    const searchTerm = `%${options.search}%`;
    query = query.or(
      `notes.ilike.${searchTerm},customers.first_name.ilike.${searchTerm},customers.last_name.ilike.${searchTerm},customers.phone.ilike.${searchTerm},id.ilike.${searchTerm}`,
    );
  }

  const { data: payments, error } = await query;

  // Debug logging
  console.log("getPayments query result:", {
    workspaceId,
    options,
    count: payments?.length || 0,
    error: error?.message,
    firstPayment: payments?.[0]
      ? {
          id: payments[0].id,
          customer_id: payments[0].customer_id,
          amount: payments[0].amount,
          customers: payments[0].customers,
        }
      : null,
  });

  if (error) {
    return { payments: [], error: error.message };
  }

  return { payments: payments ?? [], error: null };
}

export async function getCustomersForPayment(workspaceId: string) {
  const supabase = await createClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone")
    .eq("workspace_id", workspaceId)
    .order("first_name", { ascending: true });

  if (error) {
    return { customers: [], error: error.message };
  }

  return { customers: customers ?? [], error: null };
}

export async function getProductsForPayment(workspaceId: string) {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, selling_price, stock_quantity, unit")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return { products: [], error: error.message };
  }

  return { products: products ?? [], error: null };
}

export async function getInvoicesForCustomer(
  workspaceId: string,
  customerId: string,
) {
  const supabase = await createClient();

  const { data: invoices, error } = await supabase
    .from("sales")
    .select("id, invoice_number, total, remaining_amount, payment_status")
    .eq("workspace_id", workspaceId)
    .eq("customer_id", customerId)
    .in("payment_status", ["pending", "partial"])
    .order("sale_date", { ascending: false });

  if (error) {
    return { invoices: [], error: error.message };
  }

  return { invoices: invoices ?? [], error: null };
}
