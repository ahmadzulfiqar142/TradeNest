"use client";

import { LedgerEntry } from "@/lib/customer-details-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RunningLedgerProps {
  ledger: LedgerEntry[];
}

export function RunningLedger({ ledger }: RunningLedgerProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                Description
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                Debit
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                Credit
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ledger.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No ledger entries found
                </td>
              </tr>
            ) : (
              ledger.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {new Date(entry.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.description}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {entry.debit > 0 ? (
                      <span className="text-orange-600 dark:text-orange-400">
                        ${Number(entry.debit).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {entry.credit > 0 ? (
                      <span className="text-green-600 dark:text-green-400">
                        ${Number(entry.credit).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    ${Number(entry.balance).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
