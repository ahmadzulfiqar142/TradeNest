"use client";

import type { PaymentHistory } from "@/lib/customer-details-data";

interface PaymentHistoryTableProps {
  payments: PaymentHistory[];
  currencySymbol: string;
}

export function PaymentHistoryTable({ payments, currencySymbol }: PaymentHistoryTableProps) {
  const fmt = (n: number) => `${currencySymbol} ${n.toLocaleString()}`;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Receipt</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Method</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Amount</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Applied To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No payment records found
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(p.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {p.receiptNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {p.paymentMethod.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                    {fmt(p.amount)}
                  </td>
                  <td className="px-4 py-3">
                    {p.invoiceNumber ? (
                      <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                        {p.invoiceNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Advance Payment</span>
                    )}
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
