"use client";

import { ArrowLeft } from "lucide-react";
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

interface PaymentDetailsClientProps {
  payment: {
    id: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    payment_status: string;
    quantity: number | null;
    product_id: string | null;
    notes: string | null;
    created_at: string;
    customers: {
      id: string;
      first_name: string;
      last_name: string;
      phone: string;
    };
    products?: {
      name: string;
      selling_price: number;
    } | null;
  };
}

export function PaymentDetailsClient({ payment }: PaymentDetailsClientProps) {
  const customerName = `${payment.customers.first_name} ${payment.customers.last_name}`;
  const productName = payment.products?.name || "N/A";
  const quantity = payment.quantity || 1;
  const unitPrice = payment.products?.selling_price || payment.amount;
  const totalAmount = payment.amount;

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link
          href="/payments"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Payments</span>
        </Link>
      </div>

      {/* Payment Information */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Payment Details
        </h1>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{productName}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.payment_status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {payment.payment_status}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize">
                    {payment.payment_method.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>{quantity}</TableCell>
                  <TableCell>${Number(unitPrice).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">
                    ${Number(totalAmount).toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Additional Information */}
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Customer
                  </label>
                  <p className="text-foreground font-medium mt-1">
                    {customerName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payment.customers.phone}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Payment Date
                  </label>
                  <p className="text-foreground mt-1">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Notes
                  </label>
                  <p className="text-foreground mt-1">
                    {payment.notes || "No notes"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Payment ID
                  </label>
                  <p className="text-foreground font-mono text-sm mt-1">
                    {payment.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created At
                  </label>
                  <p className="text-foreground mt-1">
                    {new Date(payment.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href={`/customers/${payment.customers.id}`}>
            View Customer Details
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/payments">Back to Payments</Link>
        </Button>
      </div>
    </div>
  );
}
