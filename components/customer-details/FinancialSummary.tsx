"use client";

import { ShoppingCart, Wallet, TrendingDown, TrendingUp } from "lucide-react";
import type { CustomerFinancialSummary } from "@/lib/customer-details-data";

interface FinancialSummaryProps {
  summary: CustomerFinancialSummary;
  currencySymbol: string;
}

export function FinancialSummary({ summary, currencySymbol }: FinancialSummaryProps) {
  const fmt = (n: number) => `${currencySymbol} ${n.toLocaleString()}`;

  const cards = [
    {
      label: "Total Sales",
      value: fmt(summary.totalSales),
      sub: `${summary.totalInvoices} invoice${summary.totalInvoices !== 1 ? "s" : ""}`,
      icon: ShoppingCart,
      color: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Total Payments",
      value: fmt(summary.totalPayments),
      sub: `${summary.totalPaymentsReceived} payment${summary.totalPaymentsReceived !== 1 ? "s" : ""}`,
      icon: Wallet,
      color: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    },
    {
      label: "Outstanding Balance",
      value: fmt(summary.outstandingBalance),
      sub: summary.outstandingBalance > 0 ? "Customer owes money" : "No outstanding amount",
      icon: TrendingDown,
      color:
        summary.outstandingBalance > 0
          ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
          : "bg-muted text-muted-foreground",
    },
    {
      label: "Advance Balance",
      value: fmt(summary.advanceBalance),
      sub: summary.advanceBalance > 0 ? "Customer credit" : "No advance",
      icon: TrendingUp,
      color:
        summary.advanceBalance > 0
          ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold text-foreground mt-2">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              </div>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
