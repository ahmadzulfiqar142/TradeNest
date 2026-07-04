"use client";

import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CustomerHeader } from "@/components/customer-details/CustomerHeader";
import { FinancialSummary } from "@/components/customer-details/FinancialSummary";
import { PurchaseHistoryTable } from "@/components/customer-details/PurchaseHistoryTable";
import { PaymentHistoryTable } from "@/components/customer-details/PaymentHistoryTable";
import { RunningLedger } from "@/components/customer-details/RunningLedger";
import { ActivityTimeline } from "@/components/customer-details/ActivityTimeline";
import {
  transformCustomer,
  transformPurchases,
  transformPayments as transformPaymentsData,
  transformLedger,
  generateActivityTimeline,
  calculateSummary,
} from "@/lib/customer-details-data";
import type {
  Customer as CustomerType,
  Sale as SaleType,
  SaleItem as SaleItemType,
  Payment as PaymentType,
  LedgerEntry as LedgerEntryType,
} from "@/lib/customer-details-data";

interface CustomerDetailsClientProps {
  customer: CustomerType;
  sales: SaleType[];
  saleItems: SaleItemType[];
  payments: PaymentType[];
  ledger: LedgerEntryType[];
  summary: {
    totalPurchases: number;
    totalPaid: number;
    remainingBalance: number;
    pendingAmount: number;
    totalOrders: number;
    lastPurchaseDate: string | null;
    lastPaymentDate: string | null;
  };
  currency: string;
  currencySymbol: string;
}

type Customer = CustomerType;
type Sale = SaleType;
type SaleItem = SaleItemType;
type Payment = PaymentType;
type LedgerEntry = LedgerEntryType;

// Dummy data for demonstration
const dummySales: SaleType[] = [
  {
    id: "1",
    invoice_number: "INV-001",
    total: 5000,
    paid_amount: 3000,
    remaining_amount: 2000,
    sale_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    payment_status: "pending",
  },
  {
    id: "2",
    invoice_number: "INV-002",
    total: 7500,
    paid_amount: 7500,
    remaining_amount: 0,
    sale_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    payment_status: "completed",
  },
];

const dummySaleItems: SaleItemType[] = [
  {
    id: "1",
    sale_id: "1",
    product_id: "p1",
    product_name: "Product A",
    quantity: 5,
    unit_price: 1000,
    discount: 0,
    total: 5000,
    created_at: new Date().toISOString(),
    sales: {
      sale_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      invoice_number: "INV-001",
    },
  },
  {
    id: "2",
    sale_id: "2",
    product_id: "p2",
    product_name: "Product B",
    quantity: 3,
    unit_price: 2500,
    discount: 0,
    total: 7500,
    created_at: new Date().toISOString(),
    sales: {
      sale_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      invoice_number: "INV-002",
    },
  },
];

const dummyPayments: PaymentType[] = [
  {
    id: "1",
    amount: 3000,
    payment_method: "bank_transfer",
    payment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Partial payment",
    reference_type: "sale",
    reference_id: "1",
  },
  {
    id: "2",
    amount: 7500,
    payment_method: "cash",
    payment_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Full payment",
    reference_type: "sale",
    reference_id: "2",
  },
];

const dummyLedger: LedgerEntryType[] = [
  {
    id: "1",
    transaction_type: "sale",
    reference_type: "sale",
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Invoice INV-002",
    debit: 7500,
    credit: 0,
    balance: 7500,
  },
  {
    id: "2",
    transaction_type: "payment",
    reference_type: "payment",
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Payment received - INV-002",
    debit: 0,
    credit: 7500,
    balance: 0,
  },
  {
    id: "3",
    transaction_type: "sale",
    reference_type: "sale",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Invoice INV-001",
    debit: 5000,
    credit: 0,
    balance: 5000,
  },
  {
    id: "4",
    transaction_type: "payment",
    reference_type: "payment",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Partial payment - INV-001",
    debit: 0,
    credit: 3000,
    balance: 2000,
  },
];

export function CustomerDetailsClient({
  customer,
  sales,
  saleItems,
  payments,
  ledger,
  summary,
  currencySymbol,
}: CustomerDetailsClientProps) {
  // Use dummy data if no real data is provided
  const displaySales = sales.length > 0 ? sales : dummySales;
  const displaySaleItems = saleItems.length > 0 ? saleItems : dummySaleItems;
  const displayPayments = payments.length > 0 ? payments : dummyPayments;
  const displayLedger = ledger.length > 0 ? ledger : dummyLedger;

  const customerData = useMemo(() => transformCustomer(customer), [customer]);

  const purchases = useMemo(
    () => transformPurchases(displaySales, displaySaleItems),
    [displaySales, displaySaleItems],
  );

  const paymentsData = useMemo(
    () => transformPaymentsData(displayPayments, displaySales),
    [displayPayments, displaySales],
  );

  const ledgerData = useMemo(
    () => transformLedger(displayLedger),
    [displayLedger],
  );

  const activities = useMemo(
    () => generateActivityTimeline(displaySales, displayPayments, customer),
    [displaySales, displayPayments, customer],
  );

  const financialSummary = useMemo(
    () => ({
      ...customerData,
      totalPurchases: summary.totalPurchases || 12500,
      totalPaid: summary.totalPaid || 10500,
      balance: summary.remainingBalance || 2000,
    }),
    [customerData, summary],
  );

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Customers</span>
        </Link>
      </div>

      {/* Customer Header */}
      <CustomerHeader customer={customer} />

      {/* Financial Summary */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">
          Financial Summary
        </h2>
        <FinancialSummary summary={summary} currencySymbol={currencySymbol} />
      </div>

      {/* Purchase & Payment History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">
            Purchase History
          </h2>
          <PurchaseHistoryTable
            sales={displaySales}
            saleItems={displaySaleItems}
          />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">
            Payment History
          </h2>
          <PaymentHistoryTable payments={paymentsData} />
        </div>
      </div>

      {/* Ledger */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">
          Running Khata (Ledger)
        </h2>
        <RunningLedger ledger={ledgerData} />
      </div>

      {/* Activity Timeline */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">
          Activity Timeline
        </h2>
        <ActivityTimeline
          sales={displaySales}
          payments={displayPayments}
          customer={customer}
        />
      </div>
    </div>
  );
}
