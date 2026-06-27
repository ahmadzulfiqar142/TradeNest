import { createClient } from "@/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, AlertCircle } from "lucide-react";

export default async function DashboardPage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  const supabase = await createClient();
  const { workspaceSlug } = await params;

  // Get workspace
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .single();

  if (!workspace) {
    return <div>Workspace not found</div>;
  }

  // Get dashboard statistics
  const { data: stats } = await supabase.rpc("get_dashboard_stats", {
    p_workspace_id: workspace.id,
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

  const statCards = [
    {
      title: "Today's Sales",
      value: `$${Number(statistics.today_sales).toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Monthly Sales",
      value: `$${Number(statistics.monthly_sales).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pending Payments",
      value: `$${Number(statistics.pending_payments).toFixed(2)}`,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Total Products",
      value: statistics.total_products,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Total Customers",
      value: statistics.total_customers,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Low Stock Items",
      value: statistics.low_stock_count,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's your business overview.</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <button className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-gray-50">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium">New Sale</span>
            </button>
            <button className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-gray-50">
              <Package className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium">Add Product</span>
            </button>
            <button className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-gray-50">
              <Users className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium">Add Customer</span>
            </button>
            <button className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-gray-50">
              <TrendingUp className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium">View Reports</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Welcome Message */}
      {statistics.total_products === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  Welcome to Your Business Management System!
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  Get started by adding your first product. Navigate to Products
                  in the sidebar to begin managing your inventory.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
