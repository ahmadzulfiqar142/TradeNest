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
  data: import("@/schemas/sale").CreateSaleFormValues,
): Promise<SaleActionState> {
  const parsed = createSaleSchema.safeParse(data);

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

  // Check for customer advance balance if customer is selected
  let availableAdvance = 0;
  if (v.customerId) {
    const { data: advancePayments } = await supabase
      .from("payments")
      .select("amount")
      .eq("workspace_id", workspaceId)
      .eq("customer_id", v.customerId)
      .is("sale_id", null)
      .is("deleted_at", null);

    availableAdvance =
      advancePayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  }

  const invoiceNumber = await generateInvoiceNumber(supabase, workspaceId);

  const isAdvancePayment = v.paymentMethod === "advance";
  // When paying via advance, pass paidAmount=0 so the RPC sees full remaining
  // and applies the advance in step 7. Passing the advance amount as p_paid_amount
  // would make p_remaining=0, causing the RPC to skip advance deduction entirely.
  const cashPaid = isAdvancePayment ? 0 : Math.min(v.paidAmount, total);

  const { data: saleId, error: rpcError } = await supabase.rpc(
    "create_sale_transaction",
    {
      p_workspace_id: workspaceId,
      p_user_id: user.id,
      p_invoice_number: invoiceNumber,
      p_customer_id: v.customerId ?? null,
      p_subtotal: itemsSubtotal,
      p_discount: v.discount,
      p_total: total,
      p_paid_amount: cashPaid,
      p_remaining: total - cashPaid,
      p_status: "pending",
      p_notes: v.notes ?? null,
      p_sale_date: v.saleDate,
      p_payment_method: cashPaid > 0 ? (v.paymentMethod ?? "") : "",
      p_items: v.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total,
      })),
    },
  );

  if (rpcError || !saleId) {
    return {
      message: rpcError?.message || "Failed to create sale",
      success: false,
    };
  }

  revalidatePath("/sales");
  revalidatePath("/");
  if (v.customerId) revalidatePath(`/customers/${v.customerId}`);

  return {
    message: "Sale created successfully",
    success: true,
    saleId: saleId as string,
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
    .eq("status", "Active")
    .is("deleted_at", null)
    .order("first_name", { ascending: true });

  if (error) return { customers: [], error: error.message };
  return { customers: data ?? [], error: null };
}

export async function updateSale(
  workspaceId: string,
  saleId: string,
  data: import("@/schemas/sale").CreateSaleFormValues,
): Promise<SaleActionState> {
  const parsed = createSaleSchema.safeParse(data);

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

  // Check if sale exists and can be edited
  const { data: existingSale, error: saleError } = await supabase
    .from("sales")
    .select("status, total, paid_amount, customer_id")
    .eq("id", saleId)
    .eq("workspace_id", workspaceId)
    .single();

  if (saleError || !existingSale) {
    return { message: "Sale not found", success: false };
  }

  // Prevent editing paid or partially paid sales
  if (
    existingSale.status === "paid" ||
    existingSale.status === "partially_paid"
  ) {
    return {
      message: `Cannot edit ${existingSale.status.replace("_", " ")} sales. Please cancel and create a new sale instead.`,
      success: false,
    };
  }

  const v = parsed.data;

  // Calculate new totals
  const itemsSubtotal = v.items.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(0, itemsSubtotal - v.discount);

  // Check for customer advance balance if customer is selected
  let availableAdvance = 0;
  if (v.customerId) {
    const { data: advancePayments } = await supabase
      .from("payments")
      .select("amount")
      .eq("workspace_id", workspaceId)
      .eq("customer_id", v.customerId)
      .is("sale_id", null)
      .is("deleted_at", null);

    availableAdvance =
      advancePayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  }

  // Calculate paid amount: user payment + advance balance
  const userPayment = Math.min(v.paidAmount, total);
  const advanceUsed = Math.min(availableAdvance, total - userPayment);
  const paidAmount = userPayment + advanceUsed;

  const status =
    paidAmount <= 0
      ? "pending"
      : paidAmount >= total
        ? "paid"
        : "partially_paid";

  // Update sale
  const { error: updateError } = await supabase
    .from("sales")
    .update({
      subtotal: itemsSubtotal,
      discount: v.discount,
      total: total,
      paid_amount: paidAmount,
      remaining_amount: total - paidAmount,
      status: status,
      notes: v.notes ?? null,
      sale_date: v.saleDate,
      payment_method: paidAmount > 0 ? (v.paymentMethod ?? null) : null,
      updated_by: user.id,
    })
    .eq("id", saleId)
    .eq("workspace_id", workspaceId);

  if (updateError) {
    return { message: updateError.message, success: false };
  }

  // If advance was used, create a payment record to track it
  if (advanceUsed > 0 && v.customerId) {
    // Get the oldest advance payment to deduct from
    const { data: advancePayments } = await supabase
      .from("payments")
      .select("id, amount")
      .eq("workspace_id", workspaceId)
      .eq("customer_id", v.customerId)
      .is("sale_id", null)
      .is("deleted_at", null)
      .order("payment_date", { ascending: true })
      .limit(1);

    if (advancePayments && advancePayments.length > 0) {
      const advancePayment = advancePayments[0];
      const remainingAdvance = Number(advancePayment.amount) - advanceUsed;

      // Update the advance payment record
      if (remainingAdvance <= 0.01) {
        // Delete the advance payment if fully consumed
        await supabase.from("payments").delete().eq("id", advancePayment.id);
      } else {
        // Update the advance payment amount
        await supabase
          .from("payments")
          .update({ amount: remainingAdvance })
          .eq("id", advancePayment.id);
      }

      // Create a payment record linked to this sale
      await supabase.from("payments").insert({
        workspace_id: workspaceId,
        customer_id: v.customerId,
        sale_id: saleId,
        amount: advanceUsed,
        payment_method: "advance",
        payment_date: v.saleDate,
        notes: `Advance payment applied (edit)`,
        created_by: user.id,
      });

      // Update customer ledger
      await supabase.rpc("update_customer_ledger", {
        p_customer_id: v.customerId,
        p_workspace_id: workspaceId,
        p_transaction_type: "payment",
        p_reference_type: "sale",
        p_reference_id: saleId,
        p_debit: 0,
        p_credit: advanceUsed,
        p_description: `Advance payment applied to sale (edit)`,
      });
    }
  }

  // Delete old sale items and insert new ones
  const { error: deleteItemsError } = await supabase
    .from("sale_items")
    .delete()
    .eq("sale_id", saleId);

  if (deleteItemsError) {
    return { message: deleteItemsError.message, success: false };
  }

  // Insert new sale items
  const saleItems = v.items.map((item) => ({
    sale_id: saleId,
    workspace_id: workspaceId,
    product_id: item.productId || "",
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    discount: item.discount,
    total: item.total,
  }));

  const { error: insertItemsError } = await supabase
    .from("sale_items")
    .insert(saleItems);

  if (insertItemsError) {
    return { message: insertItemsError.message, success: false };
  }

  // Update customer ledger if customer changed
  if (
    v.customerId &&
    existingSale.customer_id &&
    existingSale.customer_id !== v.customerId
  ) {
    // If customer changed, we need to update ledger entries
    // This is a simplified version - in production, you'd want to handle this more carefully
    await supabase.rpc("update_customer_ledger", {
      p_customer_id: existingSale.customer_id,
      p_workspace_id: workspaceId,
      p_transaction_type: "adjustment",
      p_reference_type: "sale",
      p_reference_id: saleId,
      p_debit: 0,
      p_credit: existingSale.total,
      p_description: `Sale edited - customer changed`,
    });

    await supabase.rpc("update_customer_ledger", {
      p_customer_id: v.customerId,
      p_workspace_id: workspaceId,
      p_transaction_type: "sale",
      p_reference_type: "sale",
      p_reference_id: saleId,
      p_debit: total,
      p_credit: 0,
      p_description: `Sale edited - customer changed`,
    });
  }

  revalidatePath("/sales");
  revalidatePath(`/sales/${saleId}`);
  if (v.customerId) revalidatePath(`/customers/${v.customerId}`);
  if (existingSale.customer_id)
    revalidatePath(`/customers/${existingSale.customer_id}`);

  return { message: "Sale updated successfully", success: true };
}

export async function deleteSale(
  workspaceId: string,
  saleId: string,
): Promise<SaleActionState> {
  const { supabase, user, error } = await getAuthorizedUser(workspaceId);
  if (error || !user)
    return { message: error ?? "Unauthorized", success: false };

  // Check if sale exists and get its status
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select("status, paid_amount, total")
    .eq("id", saleId)
    .eq("workspace_id", workspaceId)
    .single();

  if (saleError || !sale) {
    return { message: "Sale not found", success: false };
  }

  // Prevent deletion of paid or partially paid sales
  if (sale.status === "paid" || sale.status === "partially_paid") {
    return {
      message: `Cannot delete ${sale.status.replace("_", " ")} sales. Please cancel the sale instead.`,
      success: false,
    };
  }

  const { error: deleteError } = await supabase
    .from("sales")
    .delete()
    .eq("id", saleId)
    .eq("workspace_id", workspaceId);

  if (deleteError) {
    return { message: deleteError.message, success: false };
  }

  revalidatePath("/sales");
  revalidatePath("/");

  return { message: "Sale deleted successfully", success: true };
}

export async function getCustomerAdvanceBalance(
  workspaceId: string,
  customerId: string,
): Promise<{ advance: number }> {
  const supabase = await createClient();

  const { data: advancePayments } = await supabase
    .from("payments")
    .select("amount")
    .eq("workspace_id", workspaceId)
    .eq("customer_id", customerId)
    .is("sale_id", null)
    .is("deleted_at", null);

  const advance =
    advancePayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  return { advance };
}
