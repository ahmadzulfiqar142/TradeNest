"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Package, Clock, Banknote,
  ShoppingCart, AlertTriangle, UserPlus, PlusCircle, CreditCard, DollarSign,
} from "lucide-react";
import { MetricCard } from "./MetricCard";
import { DateRangeFilter } from "./DateRangeFilter";
import { getDateRange, DEFAULT_PRESET } from "@/lib/dashboard-filters";
import { getAllDashboardData } from "@/actions/dashboard";
import type { FilterPreset, DateRange } from "@/lib/dashboard-filters";
import type {
  DashboardSummary, RecentSale, RecentPayment,
  TopProduct, LowStockProduct, ExpiryProduct, SalesTrendPoint,
} from "@/actions/dashboard";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    partial: "bg-yellow-100 text-yellow-700",
    pending: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function ExpiryBadge({ days }: { days: number }) {
  if (days < 0) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Expired</span>;
  if (days <= 7) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">≤ 7 days</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">≤ 30 days</span>;
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground text-center py-6">{message}</p>;
}

export interface DashboardData {
  summary: DashboardSummary;
  recentSales: RecentSale[];
  recentPayments: RecentPayment[];
  topProducts: TopProduct[];
  lowStock: LowStockProduct[];
  expiryProducts: ExpiryProduct[];
  salesTrend: SalesTrendPoint[];
}

interface DashboardClientProps {
  workspaceId: string;
  initialData: DashboardData;
  initialPreset: FilterPreset;
  initialCustomRange?: DateRange;
}

export default function DashboardClient({
  workspaceId,
  initialData,
  initialPreset,
  initialCustomRange,
}: DashboardClientProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [preset, setPreset] = useState<FilterPreset>(initialPreset);
  const [customRange, setCustomRange] = useState<DateRange | undefined>(initialCustomRange);
  const [isPending, startTransition] = useTransition();

  function handleFilterChange(newPreset: FilterPreset, newCustom?: DateRange) {
    setPreset(newPreset);
    setCustomRange(newCustom);
    const range = getDateRange(newPreset, newCustom);
    startTransition(async () => {
      const fresh = await getAllDashboardData(workspaceId, range);
      setData(fresh);
    });
  }

  const { summary, recentSales, recentPayments, topProducts, lowStock, expiryProducts, salesTrend } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Business overview at a glance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <DateRangeFilter value={preset} customRange={customRange} onChange={handleFilterChange} />
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/customers/new" className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
              <UserPlus className="w-4 h-4" /> Customer
            </Link>
            <Link href="/products/new" className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
              <PlusCircle className="w-4 h-4" /> Product
            </Link>
            <Link href="/sales/new" className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <ShoppingCart className="w-4 h-4" /> New Sale
            </Link>
          </div>
        </div>
      </div>

      {/* Content with loading overlay */}
      <div className={`space-y-6 transition-opacity duration-200 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Sales" value={fmt(summary.totalSales)} icon={TrendingUp} />
          <MetricCard title="Total Revenue" value={fmt(summary.totalRevenue)} icon={DollarSign} />
          <MetricCard title="Total Profit" value={fmt(summary.totalProfit)} icon={TrendingUp} />
          <MetricCard title="Total Loss" value={fmt(summary.totalLoss)} icon={TrendingDown} />
          <MetricCard title="Total Orders" value={summary.totalOrders} icon={ShoppingCart} />
          <MetricCard title="New Customers" value={summary.totalCustomers} icon={Users} />
          <MetricCard title="Pending Balance" value={fmt(summary.pendingBalance)} icon={Clock} />
          <MetricCard title="Advance Balance" value={fmt(summary.advanceBalance)} icon={Banknote} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl bg-card border border-border p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">Sales Trend</h3>
            {salesTrend.length === 0 ? (
              <EmptyState message="No sales in this period" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={salesTrend}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    formatter={(v) => [fmt(Number(v)), "Sales"]}
                    labelFormatter={(d) => fmtDate(String(d))}
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#2563EB" fill="url(#salesGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-2xl bg-card border border-border p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">Top Products</h3>
            {topProducts.length === 0 ? (
              <EmptyState message="No sales in this period" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <YAxis
                    type="category"
                    dataKey="product_name"
                    width={80}
                    tick={{ fontSize: 10 }}
                    stroke="var(--color-muted-foreground)"
                    tickFormatter={(v: string) => v.length > 10 ? v.slice(0, 10) + "…" : v}
                  />
                  <Tooltip
                    formatter={(v) => [Number(v), "Qty Sold"]}
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                  />
                  <Bar dataKey="quantity_sold" fill="#2563EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Alerts */}
        {(lowStock.length > 0 || expiryProducts.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {lowStock.length > 0 && (
              <SectionCard
                title={`Low Stock (${lowStock.length})`}
                action={<Link href="/inventory/alerts" className="text-xs text-primary hover:underline">View all</Link>}
              >
                <div className="space-y-2">
                  {lowStock.slice(0, 5).map((p) => (
                    <div key={p.product_id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span className="text-foreground truncate max-w-[180px]">{p.product_name}</span>
                      </div>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {p.stock_quantity} / {p.min_stock_quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {expiryProducts.length > 0 && (
              <SectionCard
                title={`Expiry Alerts (${expiryProducts.length})`}
                action={<Link href="/inventory/alerts" className="text-xs text-primary hover:underline">View all</Link>}
              >
                <div className="space-y-2">
                  {expiryProducts.slice(0, 5).map((p) => (
                    <div key={p.product_id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground truncate max-w-[180px]">{p.product_name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-muted-foreground text-xs">{fmtDate(p.expiry_date)}</span>
                        <ExpiryBadge days={p.days_until_expiry} />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* Recent Sales & Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard
            title="Recent Sales"
            action={<Link href="/sales" className="text-xs text-primary hover:underline">View all</Link>}
          >
            {recentSales.length === 0 ? (
              <EmptyState message="No sales in this period" />
            ) : (
              <div className="space-y-1">
                {recentSales.map((s) => (
                  <Link
                    key={s.id}
                    href={`/sales/${s.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{s.customer_name ?? "Walk-in"} · {fmtDate(s.sale_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{fmt(s.total)}</p>
                      <PaymentStatusBadge status={s.payment_status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Recent Payments"
            action={<Link href="/payments" className="text-xs text-primary hover:underline">View all</Link>}
          >
            {recentPayments.length === 0 ? (
              <EmptyState message="No payments in this period" />
            ) : (
              <div className="space-y-1">
                {recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.customer_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{p.payment_method} · {fmtDate(p.payment_date)}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-green-600">{fmt(p.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
