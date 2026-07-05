"use client";

import type { LedgerEntry } from "@/lib/customer-details-data";

interface RunningLedgerProps {
  ledger: LedgerEntry[];
  currencySymbol: string;
}

const TYPE_STYLES: Record<LedgerEntry["type"], string> = {
  SALE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PAYMENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  ADVANCE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  REFUND: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  ADJUSTMENT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export function RunningLedger({ ledger, currencySymbol }: RunningLedgerProps) {
  const fmt = (n: number) => (n > 0 ? `${currencySymbol} ${n.toLocaleString()}` : "—");

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Reference</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Debit</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Credit</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ledger.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No ledger entries found
                </td>
              </tr>
            ) : (
              ledger.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TYPE_STYLES[entry.type]}`}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                    {entry.reference}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                    {fmt(entry.debit)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-orange-600 dark:text-orange-400">
                    {fmt(entry.credit)}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${
                    entry.balance > 0
                      ? "text-green-600 dark:text-green-400"
                      : entry.balance < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                  }`}>
                    {entry.balance === 0
                      ? "—"
                      : `${entry.balance < 0 ? "-" : ""}${currencySymbol} ${Math.abs(entry.balance).toLocaleString()}`}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {ledger.length > 0 && (
        <div className="px-4 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground">
          Positive balance = Customer credit &nbsp;·&nbsp; Negative balance = Customer owes money
        </div>
      )}
    </div>
  );
}
