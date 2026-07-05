"use client";

import type { InvoiceHistory } from "@/lib/customer-details-data";

interface PurchaseHistoryTableProps {
  invoices: InvoiceHistory[];
  currencySymbol: string;
}

const STATUS_STYLES: Record<InvoiceHistory["status"], string> = {
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  partially_paid: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  pending: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const STATUS_LABELS: Record<InvoiceHistory["status"], string> = {
  paid: "Paid",
  partially_paid: "Partial",
  pending: "Pending",
  cancelled: "Cancelled",
};

export function PurchaseHistoryTable({ invoices, currencySymbol }: PurchaseHistoryTableProps) {
  const fmt = (n: number) => `${currencySymbol} ${n.toLocaleString()}`;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Invoice</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Products</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Total</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Paid</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Remaining</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No invoices found
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-sm font-medium">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(inv.saleDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs">
                    {inv.items.length === 0
                      ? "—"
                      : inv.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{fmt(inv.total)}</td>
                  <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                    {fmt(inv.paidAmount)}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400">
                    {inv.remainingAmount > 0 ? fmt(inv.remainingAmount) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[inv.status]}`}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
