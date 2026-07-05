"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/supabase/server";
import { createSaleSchema } from "@/schemas/sale";

export type SaleActionState = {
  message: string;
  success: boolean;
  saleId?: string;
};

async function getAuthorizedUser(workspaceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user)
    return { supabase, user: null, error: "Unauthorized" };

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member)
    return { supabase, user: null, error: "No access to this workspace." };

  return { supabase, user, error: null };
}

async function generateInvoiceNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
): Promise<string> {
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("invoice_prefix")
    .eq("id", workspaceId)
    .single();

  const prefix = workspace?.invoice_prefix || "INV";

  const { data: lastSale } = await supabase
    .from("sales")
    .select("invoice_number")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextNum = 1;
  if (lastSale?.invoice_number) {
    const match = lastSale.invoice_number.match(/(\d+)$/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }

  return `${prefix}-${String(nextNum).padStart(6, "0")}`;
}

export async function createSale(
  workspaceId: string,
  _prev: SaleActionState,
  formData: FormData,
): Promise<SaleActionState> {
  let parsed;
  try {
    const raw = formData.get("payload")?.toString();
    if (!raw) return { message: "Invalid request", success: false };
    parsed = createSaleSchema.safeParse(JSON.parse(raw));
  } catch {
    return { message: "Invalid request data", success: false };
  }

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ?? "Check the details and try again.",
      success: false,
    };
  }

  const { supabase, user, error } = await getAuthorizedUser(workspaceId);
  if (error || !user)
    return { message: error ?? "Unauthorized", success: false };

  const v = parsed.data;

  // Calculate totals
  const itemsSubtotal = v.items.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(0, itemsSubtotal - v.discount);
  const paidAmount = Math.min(v.paidAmount, total);

  const status =
    paidAmount <= 0
      ? "pending"
      : paidAmount >= total
        ? "paid"
        : "partially_paid";

  const invoiceNumber = await generateInvoiceNumber(supabase, workspaceId);

  // Insert sale
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      workspace_id: workspaceId,
      invoice_number: invoiceNumber,
      customer_id: v.customerId ?? null,
      subtotal: itemsSubtotal,
      discount: v.discount,
      tax: 0,
      total,
      paid_amount: paidAmount,
      remaining_amount: total - paidAmount,
      status,
      notes: v.notes ?? null,
      sale_date: v.saleDate,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (saleError || !sale) {
    return {
      message: saleError?.message || "Failed to create sale",
      success: false,
    };
  }

  // Insert sale items + deduct stock
  for (const item of v.items) {
    await supabase.from("sale_items").insert({
      workspace_id: workspaceId,
      sale_id: sale.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount: item.discount,
      tax: 0,
      total: item.total,
    });

    // Deduct stock
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", item.productId)
      .eq("workspace_id", workspaceId)
      .single();

    if (product) {
      const newStock = Math.max(0, product.stock_quantity - item.quantity);
      await supabase
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", item.productId)
        .eq("workspace_id", workspaceId);

      await supabase.from("inventory_transactions").insert({
        workspace_id: workspaceId,
        product_id: item.productId,
        transaction_type: "out",
        quantity: item.quantity,
        previous_stock: product.stock_quantity,
        new_stock: newStock,
        reference_type: "sale",
        reference_id: sale.id,
        notes: `Sale: ${invoiceNumber}`,
        created_by: user.id,
      });
    }
  }

  // Record ledger entry for the sale (credit = goods sold)
  if (v.customerId) {
    await supabase.rpc("update_customer_ledger", {
      p_customer_id: v.customerId,
      p_workspace_id: workspaceId,
      p_transaction_type: "sale",
      p_reference_type: "sale",
      p_reference_id: sale.id,
      p_debit: 0,
      p_credit: total,
      p_description: `Sale: ${invoiceNumber}`,
    });
  }

  // Record initial payment if any
  if (paidAmount > 0 && v.paymentMethod) {
    const { data: payment } = await supabase
      .from("payments")
      .insert({
        workspace_id: workspaceId,
        customer_id: v.customerId!,
        sale_id: sale.id,
        amount: paidAmount,
        payment_method: v.paymentMethod,
        payment_date: v.saleDate,
        notes: `Payment for ${invoiceNumber}`,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (payment && v.customerId) {
      await supabase.rpc("update_customer_ledger", {
        p_customer_id: v.customerId,
        p_workspace_id: workspaceId,
        p_transaction_type: "payment",
        p_reference_type: "payment",
        p_reference_id: payment.id,
        p_debit: paidAmount,
        p_credit: 0,
        p_description: `Payment for ${invoiceNumber}`,
      });
    }
  }

  revalidatePath("/sales");
  revalidatePath("/");
  if (v.customerId) revalidatePath(`/customers/${v.customerId}`);

  return {
    message: "Sale created successfully",
    success: true,
    saleId: sale.id,
  };
}

export async function cancelSale(
  workspaceId: string,
  saleId: string,
): Promise<SaleActionState> {
  const { supabase, user, error } = await getAuthorizedUser(workspaceId);
  if (error || !user)
    return { message: error ?? "Unauthorized", success: false };

  const { data: sale } = await supabase
    .from("sales")
    .select("status, customer_id, invoice_number, total")
    .eq("id", saleId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!sale) return { message: "Sale not found", success: false };
  if (sale.status === "cancelled")
    return { message: "Sale already cancelled", success: false };

  const { error: updateError } = await supabase
    .from("sales")
    .update({ status: "cancelled", payment_status: "pending" })
    .eq("id", saleId)
    .eq("workspace_id", workspaceId);

  if (updateError) return { message: updateError.message, success: false };

  // Restore stock
  const { data: items } = await supabase
    .from("sale_items")
    .select("product_id, quantity")
    .eq("sale_id", saleId);

  for (const item of items ?? []) {
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", item.product_id)
      .single();

    if (product) {
      const newStock = product.stock_quantity + item.quantity;
      await supabase
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", item.product_id);

      await supabase.from("inventory_transactions").insert({
        workspace_id: workspaceId,
        product_id: item.product_id,
        transaction_type: "in",
        quantity: item.quantity,
        previous_stock: product.stock_quantity,
        new_stock: newStock,
        reference_type: "sale_cancel",
        reference_id: saleId,
        notes: `Cancelled: ${sale.invoice_number}`,
        created_by: user.id,
      });
    }
  }

  revalidatePath("/sales");
  revalidatePath(`/sales/${saleId}`);
  revalidatePath("/");

  return { message: "Sale cancelled successfully", success: true };
}

export async function getSales(
  workspaceId: string,
  options?: {
    customerId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  },
) {
  const supabase = await createClient();

  let query = supabase
    .from("sales")
    .select(
      `
      id, invoice_number, total, paid_amount, remaining_amount,
      status, payment_status, sale_date, notes, created_at,
      customers(id, first_name, last_name, phone)
    `,
    )
    .eq("workspace_id", workspaceId)
    .order("sale_date", { ascending: false });

  if (options?.customerId) query = query.eq("customer_id", options.customerId);
  if (options?.status)
    query = query.eq(
      "status",
      options.status as "pending" | "partially_paid" | "paid" | "cancelled",
    );
  if (options?.startDate) query = query.gte("sale_date", options.startDate);
  if (options?.endDate) query = query.lte("sale_date", options.endDate);

  const { data, error } = await query;
  if (error) return { sales: [], error: error.message };
  return { sales: data ?? [], error: null };
}

export async function getSaleDetails(workspaceId: string, saleId: string) {
  const supabase = await createClient();

  const { data: sale, error } = await supabase
    .from("sales")
    .select(
      `
      *,
      customers(id, first_name, last_name, phone, address, city)
    `,
    )
    .eq("id", saleId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !sale)
    return { sale: null, items: [], payments: [], error: "Sale not found" };

  const { data: items } = await supabase
    .from("sale_items")
    .select("*")
    .eq("sale_id", saleId)
    .order("created_at", { ascending: true });

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, payment_method, payment_date, reference_number, notes")
    .eq("sale_id", saleId)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("payment_date", { ascending: true });

  return { sale, items: items ?? [], payments: payments ?? [], error: null };
}

export async function getProductsForSale(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, name, selling_price, stock_quantity, sku")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) return { products: [], error: error.message };
  return { products: data ?? [], error: null };
}

export async function getCustomersForSale(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("first_name", { ascending: true });

  if (error) return { customers: [], error: error.message };
  return { customers: data ?? [], error: null };
}
