"use server";

import { createClient } from "@/supabase/server";
import type { DateRange } from "@/lib/dashboard-filters";

export type DashboardSummary = {
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  totalLoss: number;
  totalOrders: number;
  totalCustomers: number;
  pendingBalance: number;
  advanceBalance: number;
};

export type RecentSale = {
  id: string;
  invoice_number: string;
  customer_name: string | null;
  sale_date: string;
  total: number;
  payment_status: string;
};

export type RecentPayment = {
  id: string;
  customer_name: string;
  amount: number;
  payment_method: string;
  payment_date: string;
};

export type TopProduct = {
  product_id: string;
  product_name: string;
  quantity_sold: number;
};

export type LowStockProduct = {
  product_id: string;
  product_name: string;
  stock_quantity: number;
  min_stock_quantity: number;
};

export type ExpiryProduct = {
  product_id: string;
  product_name: string;
  batch_id: string | null;
  batch_number: string | null;
  expiry_date: string;
  days_until_expiry: number;
  stock_quantity: number;
};

export type SalesTrendPoint = {
  date: string;
  total: number;
};

export async function getDashboardSummary(
  workspaceId: string,
  range: DateRange,
): Promise<DashboardSummary> {
  const supabase = await createClient();

  const [salesRes, saleItemsRes, customersRes, pendingRes, advanceRes] =
    await Promise.all([
      supabase
        .from("sales")
        .select("id, total, paid_amount")
        .eq("workspace_id", workspaceId)
        .gte("sale_date", range.from)
        .lte("sale_date", range.to)
        .neq("status", "cancelled"),
      supabase
        .from("sale_items")
        .select(
          "quantity, total, products!inner(purchase_price), sales!inner(workspace_id, sale_date, status)",
        )
        .eq("sales.workspace_id", workspaceId)
        .gte("sales.sale_date", range.from)
        .lte("sales.sale_date", range.to)
        .neq("sales.status", "cancelled"),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .gte("created_at", range.from)
        .lte("created_at", range.to + "T23:59:59")
        .is("deleted_at", null),
      supabase
        .from("sales")
        .select("remaining_amount")
        .eq("workspace_id", workspaceId)
        .in("payment_status", ["pending", "partial"]),
      supabase
        .from("payments")
        .select("amount")
        .eq("workspace_id", workspaceId)
        .is("sale_id", null)
        .is("deleted_at", null),
    ]);

  const sales = salesRes.data ?? [];
  const totalSales = sales.reduce((acc, s) => acc + Number(s.total), 0);
  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.paid_amount), 0);

  const grossProfit = (saleItemsRes.data ?? []).reduce((acc, item) => {
    const cost = Number(item.products.purchase_price) * item.quantity;
    return acc + (Number(item.total) - cost);
  }, 0);
  const totalProfit = grossProfit > 0 ? grossProfit : 0;
  const totalLoss = grossProfit < 0 ? Math.abs(grossProfit) : 0;

  return {
    totalSales,
    totalRevenue,
    totalProfit,
    totalLoss,
    totalOrders: sales.length,
    totalCustomers: customersRes.count ?? 0,
    pendingBalance: (pendingRes.data ?? []).reduce(
      (acc, s) => acc + Number(s.remaining_amount),
      0,
    ),
    advanceBalance: (advanceRes.data ?? []).reduce(
      (acc, p) => acc + Number(p.amount),
      0,
    ),
  };
}

export async function getRecentSales(
  workspaceId: string,
  range: DateRange,
): Promise<RecentSale[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sales")
    .select(
      "id, invoice_number, total, payment_status, sale_date, customers(first_name, last_name)",
    )
    .eq("workspace_id", workspaceId)
    .gte("sale_date", range.from)
    .lte("sale_date", range.to)
    .order("sale_date", { ascending: false })
    .limit(10);

  return (data ?? []).map((s) => ({
    id: s.id,
    invoice_number: s.invoice_number,
    customer_name: s.customers
      ? `${s.customers.first_name} ${s.customers.last_name}`
      : null,
    sale_date: s.sale_date,
    total: Number(s.total),
    payment_status: s.payment_status,
  }));
}

export async function getRecentPayments(
  workspaceId: string,
  range: DateRange,
): Promise<RecentPayment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select(
      "id, amount, payment_method, payment_date, customers(first_name, last_name)",
    )
    .eq("workspace_id", workspaceId)
    .gte("payment_date", range.from)
    .lte("payment_date", range.to)
    .is("deleted_at", null)
    .order("payment_date", { ascending: false })
    .limit(10);

  return (data ?? []).map((p) => ({
    id: p.id,
    customer_name: p.customers
      ? `${p.customers.first_name} ${p.customers.last_name}`
      : "—",
    amount: Number(p.amount),
    payment_method: p.payment_method,
    payment_date: p.payment_date,
  }));
}

export async function getTopProducts(
  workspaceId: string,
  range: DateRange,
): Promise<TopProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sale_items")
    .select(
      "product_id, product_name, quantity, sales!inner(workspace_id, status, sale_date)",
    )
    .eq("sales.workspace_id", workspaceId)
    .neq("sales.status", "cancelled")
    .gte("sales.sale_date", range.from)
    .lte("sales.sale_date", range.to);

  if (!data) return [];

  const map = new Map<
    string,
    { product_name: string; quantity_sold: number }
  >();
  for (const item of data) {
    if (!item.product_id) continue;
    const existing = map.get(item.product_id);
    if (existing) {
      existing.quantity_sold += item.quantity;
    } else {
      map.set(item.product_id, {
        product_name: item.product_name,
        quantity_sold: item.quantity,
      });
    }
  }

  return Array.from(map.entries())
    .map(([product_id, v]) => ({ product_id, ...v }))
    .sort((a, b) => b.quantity_sold - a.quantity_sold)
    .slice(0, 10);
}

export async function getLowStockProducts(
  workspaceId: string,
): Promise<LowStockProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_low_stock_products", {
    p_workspace_id: workspaceId,
  });

  return (data ?? []).map((p) => ({
    product_id: p.product_id,
    product_name: p.product_name,
    stock_quantity: p.stock_quantity,
    min_stock_quantity: p.min_stock_quantity,
  }));
}

export async function getExpiryProducts(
  workspaceId: string,
): Promise<ExpiryProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_expiry_alerts", {
    p_workspace_id: workspaceId,
    p_days_threshold: 30,
  });

  return (data ?? []).map((p) => ({
    product_id: p.product_id,
    product_name: p.product_name,
    batch_id: p.batch_id ?? null,
    batch_number: p.batch_number ?? null,
    expiry_date: p.expiry_date,
    days_until_expiry: p.days_until_expiry,
    stock_quantity: p.stock_quantity,
  }));
}

export async function getSalesTrend(
  workspaceId: string,
  range: DateRange,
): Promise<SalesTrendPoint[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sales")
    .select("sale_date, total")
    .eq("workspace_id", workspaceId)
    .gte("sale_date", range.from)
    .lte("sale_date", range.to)
    .neq("status", "cancelled")
    .order("sale_date", { ascending: true });

  const map = new Map<string, number>();
  for (const s of data ?? []) {
    map.set(s.sale_date, (map.get(s.sale_date) ?? 0) + Number(s.total));
  }

  return Array.from(map.entries()).map(([date, total]) => ({ date, total }));
}

export async function getAllDashboardData(
  workspaceId: string,
  range: DateRange,
) {
  const [
    summary,
    recentSales,
    recentPayments,
    topProducts,
    lowStock,
    expiryProducts,
    salesTrend,
  ] = await Promise.all([
    getDashboardSummary(workspaceId, range),
    getRecentSales(workspaceId, range),
    getRecentPayments(workspaceId, range),
    getTopProducts(workspaceId, range),
    getLowStockProducts(workspaceId),
    getExpiryProducts(workspaceId),
    getSalesTrend(workspaceId, range),
  ]);

  return {
    summary,
    recentSales,
    recentPayments,
    topProducts,
    lowStock,
    expiryProducts,
    salesTrend,
  };
}
