"use client";

import { PaymentRecord } from "@/lib/customer-details-data";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PaymentHistoryTableProps {
  payments: PaymentRecord[];
}

export function PaymentHistoryTable({ payments }: PaymentHistoryTableProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
        );
      case "pending":
        return (
          <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        );
      case "failed":
        return (
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
        );
      default:
        return null;
    }
  };

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
                Reference
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                Method
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No payment records found
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {new Date(payment.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {payment.refNo}
                  </TableCell>
                  <TableCell className="capitalize">{payment.method}</TableCell>
                  <TableCell className="text-right font-semibold">
                    ${Number(payment.amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(payment.status)}
                      <span className="text-xs font-medium text-muted-foreground capitalize">
                        {payment.status}
                      </span>
                    </div>
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
