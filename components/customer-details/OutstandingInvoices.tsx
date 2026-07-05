"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InvoiceHistory } from "@/lib/customer-details-data";

interface OutstandingInvoicesProps {
  invoices: InvoiceHistory[];
  currencySymbol: string;
  onPayNow: (invoiceId: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  partially_paid: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  pending: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export function OutstandingInvoices({
  invoices,
  currencySymbol,
  onPayNow,
}: OutstandingInvoicesProps) {
  const outstanding = invoices.filter(
    (inv) => inv.status === "pending" || inv.status === "partially_paid",
  );
  const fmt = (n: number) => `${currencySymbol} ${n.toLocaleString()}`;

  if (outstanding.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground text-sm">No outstanding invoices</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 dark:bg-orange-950 border-b border-border">
        <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
          {outstanding.length} outstanding invoice{outstanding.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Invoice</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Date</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Total</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Paid</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Remaining</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {outstanding.map((inv) => (
              <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-sm font-medium">{inv.invoiceNumber}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {new Date(inv.saleDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right font-semibold">{fmt(inv.total)}</td>
                <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                  {fmt(inv.paidAmount)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">
                  {fmt(inv.remainingAmount)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      STATUS_STYLES[inv.status] ?? ""
                    }`}
                  >
                    {inv.status === "partially_paid" ? "Partial" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPayNow(inv.id)}
                    className="text-xs h-7"
                  >
                    Pay Now
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
