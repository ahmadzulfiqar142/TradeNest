import { createClient } from "@/supabase/server";
import { getActiveWorkspaceId } from "@/lib/workspace-cookie";
import { redirect } from "next/navigation";
import DashboardClient from "@/features/dashboard/components/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) redirect("/create-workspace");

  const { data: stats } = await supabase.rpc("get_dashboard_stats", {
    p_workspace_id: workspaceId,
  });

  // Get pending amount (sales with pending/partial payment)
  const { data: pendingSales } = await supabase
    .from("sales")
    .select("remaining_amount")
    .eq("workspace_id", workspaceId)
    .in("payment_status", ["pending", "partial"]);

  const pendingAmount =
    pendingSales?.reduce(
      (sum, sale) => sum + Number(sale.remaining_amount),
      0,
    ) || 0;

  // Get advance balance (total advance payments - total sales)
  const { data: advancePayments } = await supabase
    .from("payments")
    .select("amount")
    .eq("workspace_id", workspaceId)
    .is("sale_id", null)
    .is("deleted_at", null);

  const totalAdvance =
    advancePayments?.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    ) || 0;

  const statistics = stats || {
    today_sales: 0,
    today_purchases: 0,
    monthly_sales: 0,
    monthly_purchases: 0,
    monthly_expenses: 0,
    pending_payments: 0,
    low_stock_count: 0,
    total_customers: 0,
    total_products: 0,
    inventory_value: 0,
  };

  // Transform server data to match client component props
  const dashboardData = {
    totalRevenue: Number(statistics.monthly_sales).toFixed(2),
    totalSales: statistics.total_products,
    totalExpenses: Number(statistics.monthly_expenses).toFixed(2),
    profitMargin: "73.5%",
    totalCustomers: statistics.total_customers,
    productsInStock: statistics.total_products,
    pendingAmount: pendingAmount.toFixed(2),
    advanceBalance: totalAdvance.toFixed(2),
    lowStockCount: statistics.low_stock_count,
    activeOrders: 156,
    avgResponseTime: "2.4h",
  };

  return <DashboardClient initialData={dashboardData} />;
}
