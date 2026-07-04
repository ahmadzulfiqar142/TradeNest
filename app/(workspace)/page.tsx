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
    activeOrders: 156,
    avgResponseTime: "2.4h",
  };

  return <DashboardClient initialData={dashboardData} />;
}
