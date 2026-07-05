"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerHeader } from "@/components/customer-details/CustomerHeader";
import { FinancialSummary } from "@/components/customer-details/FinancialSummary";
import { RunningLedger } from "@/components/customer-details/RunningLedger";
import { PurchaseHistoryTable } from "@/components/customer-details/PurchaseHistoryTable";
import { PaymentHistoryTable } from "@/components/customer-details/PaymentHistoryTable";
import { OutstandingInvoices } from "@/components/customer-details/OutstandingInvoices";
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
  workspaceId: string;
  customer: Customer;
  invoices: InvoiceHistory[];
  payments: PaymentHistory[];
  ledger: LedgerEntry[];
  summary: CustomerFinancialSummary;
  currency: string;
  currencySymbol: string;
}

type Tab = "outstanding" | "ledger" | "invoices" | "payments" | "timeline";

const TABS: { id: Tab; label: string }[] = [
  { id: "outstanding", label: "Outstanding" },
  { id: "ledger", label: "Ledger" },
  { id: "invoices", label: "Invoices" },
  { id: "payments", label: "Payments" },
  { id: "timeline", label: "Activity" },
];

export function CustomerDetailsClient({
  workspaceId,
  customer,
  invoices,
  payments,
  ledger,
  summary,
  currencySymbol,
}: CustomerDetailsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("outstanding");
  const [showAddPayment, setShowAddPayment] = useState(false);
  // saleId to pre-select in the payment form (set by Pay Now)
  const [preselectedSaleId, setPreselectedSaleId] = useState<string | null>(null);

  // Open sales for the payment form dropdown
  const openSales = invoices
    .filter((inv) => inv.status === "pending" || inv.status === "partially_paid")
    .map((inv) => ({
      id: inv.id,
      invoice_number: inv.invoiceNumber,
      total: inv.total,
      status: inv.status,
    }));

  function handlePayNow(invoiceId: string) {
    setPreselectedSaleId(invoiceId);
    setShowAddPayment(true);
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePaymentSuccess() {
    setShowAddPayment(false);
    setPreselectedSaleId(null);
  }

  const outstandingCount = openSales.length;

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <CustomerHeader customer={customer} summary={summary} currencySymbol={currencySymbol} />

      {/* Financial Summary */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Financial Summary</h2>
        <FinancialSummary summary={summary} currencySymbol={currencySymbol} />
      </div>

      {/* Add Payment toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Transactions</h2>
        <Button
          size="sm"
          onClick={() => {
            setPreselectedSaleId(null);
            setShowAddPayment((v) => !v);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payment
        </Button>
      </div>

      {showAddPayment && (
        <PaymentForm
          workspaceId={workspaceId}
          customers={[customer]}
          openSales={openSales}
          preselectedSaleId={preselectedSaleId}
          mode="create"
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.id === "outstanding" && outstandingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-xs font-bold">
                  {outstandingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "outstanding" && (
          <OutstandingInvoices
            invoices={invoices}
            currencySymbol={currencySymbol}
            onPayNow={handlePayNow}
          />
        )}
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
