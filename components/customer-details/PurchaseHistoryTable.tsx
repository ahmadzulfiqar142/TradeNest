"use client";

import { Sale, SaleItem } from "@/lib/customer-details-data";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PurchaseHistoryTableProps {
  sales: Sale[];
  saleItems: SaleItem[];
}

export function PurchaseHistoryTable({
  sales,
  saleItems,
}: PurchaseHistoryTableProps) {
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
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
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
                Invoice
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                Product
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                Total
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sales.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No purchase history found
                </td>
              </tr>
            ) : (
              sales.map((sale) => {
                const items = saleItems.filter(
                  (item) => item.sale_id === sale.id,
                );
                return (
                  <tr
                    key={sale.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-mono text-sm">
                      {sale.invoice_number}
                    </TableCell>
                    <TableCell>
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {items.length > 0
                        ? items.map((item) => item.product_name).join(", ")
                        : "No items"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(sale.total).toLocaleString()}
                    </TableCell>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(
                          sale.payment_status?.toLowerCase() || "pending",
                        )}
                        <span className="text-xs font-medium text-muted-foreground capitalize">
                          {sale.payment_status?.toLowerCase() || "pending"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
