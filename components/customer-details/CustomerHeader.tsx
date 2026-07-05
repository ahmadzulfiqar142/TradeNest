"use client";

import { Phone, MapPin, Calendar, TrendingDown, TrendingUp } from "lucide-react";
import type { Customer, CustomerFinancialSummary } from "@/lib/customer-details-data";

interface CustomerHeaderProps {
  customer: Customer;
  summary: CustomerFinancialSummary;
  currencySymbol: string;
}

export function CustomerHeader({ customer, summary, currencySymbol }: CustomerHeaderProps) {
  const hasOutstanding = summary.outstandingBalance > 0;
  const hasAdvance = summary.advanceBalance > 0;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {customer.first_name} {customer.last_name}
            </h1>
            {customer.notes && (
              <p className="text-muted-foreground text-sm mt-1">{customer.notes}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {customer.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{customer.phone}</span>
              </div>
            )}
            {(customer.address || customer.city) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{[customer.address, customer.city].filter(Boolean).join(", ")}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Member since {new Date(customer.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              customer.status === "Active"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
            }`}
          >
            {customer.status}
          </div>

          {hasOutstanding && (
            <div className="text-right bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Outstanding</span>
              </div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
                {currencySymbol} {summary.outstandingBalance.toLocaleString()}
              </p>
            </div>
          )}

          {hasAdvance && (
            <div className="text-right bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Advance Balance</span>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                {currencySymbol} {summary.advanceBalance.toLocaleString()}
              </p>
            </div>
          )}

          {!hasOutstanding && !hasAdvance && (
            <div className="text-right bg-muted rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Balance</p>
              <p className="text-2xl font-bold text-foreground mt-1">Settled</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
