"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { PaymentForm } from "@/features/payments/components/payment-form";

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
  products: {
    id: string;
    name: string;
    selling_price: number;
    stock_quantity: number;
    unit: string | null;
  }[];
}

type Customer = CustomerType;
type Sale = SaleType;
type SaleItem = SaleItemType;
type Payment = PaymentType;
type LedgerEntry = LedgerEntryType;

export function CustomerDetailsClient({
  customer,
  sales,
  saleItems,
  payments,
  ledger,
  summary,
  currencySymbol,
  products = [],
}: CustomerDetailsClientProps) {
  const [showAddPayment, setShowAddPayment] = useState(false);

  const customerData = useMemo(() => transformCustomer(customer), [customer]);

  const purchases = useMemo(
    () => transformPurchases(sales, saleItems),
    [sales, saleItems],
  );

  const paymentsData = useMemo(
    () => transformPaymentsData(payments, sales),
    [payments, sales],
  );

  const ledgerData = useMemo(() => transformLedger(ledger), [ledger]);

  const activities = useMemo(
    () => generateActivityTimeline(sales, payments, customer),
    [sales, payments, customer],
  );

  const financialSummary = useMemo(
    () => ({
      ...customerData,
      totalPurchases: summary.totalPurchases,
      totalPaid: summary.totalPaid,
      balance: summary.remainingBalance,
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

      {/* Transaction History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">
            Transaction History
          </h2>
          <Button size="sm" onClick={() => setShowAddPayment(!showAddPayment)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
        </div>
        {showAddPayment && (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <PaymentForm
                workspaceId={customer.id}
                customers={[customer]}
                products={products}
                mode="create"
                onSuccess={() => setShowAddPayment(false)}
              />
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Invoice/Ref</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const transactions: any[] = [];

                  // Add sales
                  sales.forEach((sale) => {
                    const saleItemsList = saleItems.filter(
                      (item) => item.sale_id === sale.id,
                    );
                    const productNames = saleItemsList
                      .map((item) => item.product_name)
                      .join(", ");
                    const totalQty = saleItemsList.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    );

                    transactions.push({
                      id: sale.id,
                      date: sale.sale_date,
                      type: "sale",
                      invoice: sale.invoice_number,
                      product: productNames || "N/A",
                      quantity: totalQty,
                      method: "-",
                      amount: Number(sale.total),
                      status: sale.payment_status,
                    });
                  });

                  // Add payments
                  payments.forEach((payment) => {
                    const sale = sales.find(
                      (s) => s.id === payment.reference_id,
                    );
                    transactions.push({
                      id: payment.id,
                      date: payment.payment_date,
                      type: "payment",
                      invoice: sale?.invoice_number || "-",
                      product: payment.notes?.includes("Product:")
                        ? payment.notes.match(/Product: (.+?) \(/)?.[1] || "N/A"
                        : "N/A",
                      quantity: payment.quantity || 1,
                      method: payment.payment_method,
                      amount: Number(payment.amount),
                      status:
                        payment.payment_status === "paid"
                          ? "completed"
                          : "pending",
                    });
                  });

                  // Sort by date descending
                  transactions.sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime(),
                  );

                  if (transactions.length === 0) {
                    return (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground"
                        >
                          No transactions found
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return transactions.map((tx) => (
                    <TableRow key={`${tx.type}-${tx.id}`}>
                      <TableCell>
                        {new Date(tx.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            tx.type === "sale"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {tx.type === "sale" ? "Purchase" : "Payment"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {tx.invoice}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {tx.product}
                      </TableCell>
                      <TableCell>{tx.quantity}</TableCell>
                      <TableCell className="capitalize">
                        {tx.method === "-" ? "-" : tx.method.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${Number(tx.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === "completed" || tx.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : tx.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">
          Activity Timeline
        </h2>
        <ActivityTimeline
          sales={sales}
          payments={payments}
          customer={customer}
        />
      </div>
    </div>
  );
}
