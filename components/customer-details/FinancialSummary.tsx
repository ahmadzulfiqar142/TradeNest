"use client";

import { DollarSign, CreditCard, Wallet, Calculator } from "lucide-react";

interface FinancialSummaryProps {
  summary: {
    totalPurchases: number;
    totalPaid: number;
    remainingBalance: number;
    pendingAmount: number;
    totalOrders: number;
    lastPurchaseDate: string | null;
    lastPaymentDate: string | null;
  };
  currencySymbol: string;
}

export function FinancialSummary({
  summary,
  currencySymbol,
}: FinancialSummaryProps) {
  const totalAmount = summary.remainingBalance + summary.totalPaid;

  const stats = [
    {
      label: "Pending Balance",
      value: `${currencySymbol}${summary.remainingBalance.toLocaleString()}`,
      subValue:
        summary.pendingAmount > 0
          ? `${currencySymbol}${summary.pendingAmount.toLocaleString()} pending`
          : undefined,
      icon: Wallet,
      color:
        summary.remainingBalance > 0
          ? "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400"
          : "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    },
    {
      label: "Paid Amount",
      value: `${currencySymbol}${summary.totalPaid.toLocaleString()}`,
      icon: CreditCard,
      color:
        "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    },
    {
      label: "Total Amount",
      value: `${currencySymbol}${totalAmount.toLocaleString()}`,
      subValue: `Pending Balance + Paid Amount`,
      icon: Calculator,
      color:
        "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {stat.value}
                </p>
                {stat.subValue && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.subValue}
                  </p>
                )}
              </div>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
