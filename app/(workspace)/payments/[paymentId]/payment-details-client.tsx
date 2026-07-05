"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PaymentDetailsClientProps {
  payment: {
    id: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    sale_id: string | null;
    reference_number: string | null;
    notes: string | null;
    created_at: string;
    customers: {
      id: string;
      first_name: string;
      last_name: string;
      phone: string;
    };
  };
}

export function PaymentDetailsClient({ payment }: PaymentDetailsClientProps) {
  const customerName = `${payment.customers.first_name} ${payment.customers.last_name}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/payments"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Payments</span>
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-foreground">Payment Details</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer</p>
              <p className="text-foreground font-medium mt-1">{customerName}</p>
              <p className="text-sm text-muted-foreground">{payment.customers.phone}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="text-foreground font-semibold text-xl mt-1">
                Rs. {Number(payment.amount).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
              <p className="text-foreground mt-1 capitalize">
                {payment.payment_method.replace(/_/g, " ")}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
              <p className="text-foreground mt-1">
                {new Date(payment.payment_date).toLocaleDateString()}
              </p>
            </div>

            {payment.reference_number && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reference Number</p>
                <p className="text-foreground font-mono text-sm mt-1">{payment.reference_number}</p>
              </div>
            )}

            {payment.sale_id && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Linked Invoice</p>
                <p className="text-foreground font-mono text-sm mt-1">
                  {payment.sale_id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="text-foreground mt-1">{payment.notes || "—"}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment ID</p>
              <p className="text-foreground font-mono text-sm mt-1">
                {payment.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-foreground mt-1">
                {new Date(payment.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href={`/customers/${payment.customers.id}`}>View Customer</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/payments">Back to Payments</Link>
        </Button>
      </div>
    </div>
  );
}
