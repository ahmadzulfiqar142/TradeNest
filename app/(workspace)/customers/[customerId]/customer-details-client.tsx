"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerHeader } from "@/components/customer-details/CustomerHeader";
import { FinancialSummary } from "@/components/customer-details/FinancialSummary";
import { RunningLedger } from "@/components/customer-details/RunningLedger";
import { PurchaseHistoryTable } from "@/components/customer-details/PurchaseHistoryTable";
import { PaymentHistoryTable } from "@/components/customer-details/PaymentHistoryTable";
import { ActivityTimeline } from "@/components/customer-details/ActivityTimeline";
import { PaymentForm } from "@/features/payments/components/payment-form";
import type {
  Customer,
  CustomerFinancialSummary,
  InvoiceHistory,
  PaymentHistory,
  LedgerEntry,
} from "@/lib/customer-details-data";

interface CustomerDetailsClientProps {
  customer: Customer;
  invoices: InvoiceHistory[];
  payments: PaymentHistory[];
  ledger: LedgerEntry[];
  summary: CustomerFinancialSummary;
  currency: string;
  currencySymbol: string;
}

type Tab = "ledger" | "invoices" | "payments" | "timeline";

const TABS: { id: Tab; label: string }[] = [
  { id: "ledger", label: "Ledger" },
  { id: "invoices", label: "Invoices" },
  { id: "payments", label: "Payments" },
  { id: "timeline", label: "Activity" },
];

export function CustomerDetailsClient({
  customer,
  invoices,
  payments,
  ledger,
  summary,
  currencySymbol,
}: CustomerDetailsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("ledger");
  const [showAddPayment, setShowAddPayment] = useState(false);

  return (
    <div className="space-y-6">
      {/* Customer Header — profile + outstanding/advance */}
      <CustomerHeader customer={customer} summary={summary} currencySymbol={currencySymbol} />

      {/* Financial Summary — 4 cards */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Financial Summary</h2>
        <FinancialSummary summary={summary} currencySymbol={currencySymbol} />
      </div>

      {/* Add Payment */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Transactions</h2>
        <Button size="sm" onClick={() => setShowAddPayment((v) => !v)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Payment
        </Button>
      </div>

      {showAddPayment && (
        <Card>
          <CardContent className="pt-6">
            <PaymentForm
              workspaceId={customer.id}
              customers={[customer]}
              mode="create"
              onSuccess={() => setShowAddPayment(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-border mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "ledger" && (
          <RunningLedger ledger={ledger} currencySymbol={currencySymbol} />
        )}
        {activeTab === "invoices" && (
          <PurchaseHistoryTable invoices={invoices} currencySymbol={currencySymbol} />
        )}
        {activeTab === "payments" && (
          <PaymentHistoryTable payments={payments} currencySymbol={currencySymbol} />
        )}
        {activeTab === "timeline" && (
          <ActivityTimeline customer={customer} invoices={invoices} payments={payments} />
        )}
      </div>
    </div>
  );
}
