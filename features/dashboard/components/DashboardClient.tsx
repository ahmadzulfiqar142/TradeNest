"use client";

import { MetricCard } from "./MetricCard";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Percent,
  Users,
  Package,
  Activity,
  Clock,
  Banknote,
} from "lucide-react";

// Sample data
const salesData = [
  { month: "Jan", sales: 4000, revenue: 2400 },
  { month: "Feb", sales: 3000, revenue: 1398 },
  { month: "Mar", sales: 2000, revenue: 9800 },
  { month: "Apr", sales: 2780, revenue: 3908 },
  { month: "May", sales: 1890, revenue: 4800 },
  { month: "Jun", sales: 2390, revenue: 3800 },
];

const revenueData = [
  { name: "Week 1", value: 4000 },
  { name: "Week 2", value: 3000 },
  { name: "Week 3", value: 5000 },
  { name: "Week 4", value: 4500 },
];

const expensesData = [
  { category: "Salaries", value: 45 },
  { category: "Operations", value: 25 },
  { category: "Marketing", value: 20 },
  { category: "Other", value: 10 },
];

const COLORS = ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD"];

const recentActivity = [
  { id: 1, action: "New order received", time: "2 hours ago", type: "order" },
  { id: 2, action: "Payment processed", time: "4 hours ago", type: "payment" },
  { id: 3, action: "Product added", time: "1 day ago", type: "product" },
  {
    id: 4,
    action: "Customer registered",
    time: "2 days ago",
    type: "customer",
  },
];

const recentSales = [
  {
    id: 1,
    customer: "John Doe",
    amount: "$2,400",
    status: "Completed",
    date: "Jan 15",
  },
  {
    id: 2,
    customer: "Jane Smith",
    amount: "$1,800",
    status: "Pending",
    date: "Jan 14",
  },
  {
    id: 3,
    customer: "Bob Johnson",
    amount: "$3,200",
    status: "Completed",
    date: "Jan 13",
  },
  {
    id: 4,
    customer: "Alice Brown",
    amount: "$1,500",
    status: "Failed",
    date: "Jan 12",
  },
];

interface DashboardClientProps {
  initialData?: {
    totalRevenue: string;
    totalSales: number;
    totalExpenses: string;
    profitMargin: string;
    totalCustomers: number;
    productsInStock: number;
    pendingAmount: string;
    advanceBalance: string;
    lowStockCount: number;
    activeOrders: number;
    avgResponseTime: string;
  };
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  // Use initial data if provided, otherwise use sample data
  const metrics = initialData || {
    totalRevenue: "$45,231.89",
    totalSales: 1234,
    totalExpenses: "$12,450",
    profitMargin: "73.5%",
    totalCustomers: 892,
    productsInStock: 2543,
    pendingAmount: "$5,230.00",
    advanceBalance: "$2,100.00",
    lowStockCount: 12,
    activeOrders: 156,
    avgResponseTime: "2.4h",
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's your business overview.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={`$${metrics.totalRevenue}`}
          icon={DollarSign}
          trend={{ value: 20.1, isPositive: true }}
        />
        <MetricCard
          title="Total Sales"
          value={metrics.totalSales}
          icon={ShoppingCart}
          trend={{ value: 15, isPositive: true }}
        />
        <MetricCard
          title="Total Expenses"
          value={`$${metrics.totalExpenses}`}
          icon={TrendingUp}
          trend={{ value: 5, isPositive: false }}
        />
        <MetricCard
          title="Profit Margin"
          value={metrics.profitMargin}
          icon={Percent}
          trend={{ value: 3.2, isPositive: true }}
        />
        <MetricCard
          title="Total Customers"
          value={metrics.totalCustomers}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Products in Stock"
          value={metrics.productsInStock}
          icon={Package}
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard
          title="Pending Amount"
          value={`$${metrics.pendingAmount}`}
          icon={Clock}
          trend={{ value: 5.2, isPositive: false }}
        />
        <MetricCard
          title="Advance Balance"
          value={`$${metrics.advanceBalance}`}
          icon={Banknote}
          trend={{ value: 3.1, isPositive: true }}
        />
        <MetricCard
          title="Low Stock Alerts"
          value={metrics.lowStockCount}
          icon={Package}
          trend={{ value: 2, isPositive: false }}
        />
        <MetricCard
          title="Active Orders"
          value={metrics.activeOrders}
          icon={Activity}
          trend={{ value: 2.5, isPositive: true }}
        />
        <MetricCard
          title="Avg. Response Time"
          value={metrics.avgResponseTime}
          icon={Clock}
          trend={{ value: 10, isPositive: false }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Sales & Revenue
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
              />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: `1px solid var(--color-border)`,
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="sales"
                fill="#2563EB"
                radius={[8, 8, 0, 0]}
                name="Sales Orders"
              />
              <Bar
                dataKey="revenue"
                fill="#60A5FA"
                radius={[8, 8, 0, 0]}
                name="Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Distribution */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Revenue by Week
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Trend */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Profit Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
              />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: `1px solid var(--color-border)`,
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563EB"
                fillOpacity={1}
                fill="url(#colorProfit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses Distribution */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Expense Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expensesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity & Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Recent Sales
          </h3>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {sale.customer}
                  </p>
                  <p className="text-xs text-muted-foreground">{sale.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {sale.amount}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      sale.status === "Completed"
                        ? "text-green-600"
                        : sale.status === "Pending"
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {sale.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
