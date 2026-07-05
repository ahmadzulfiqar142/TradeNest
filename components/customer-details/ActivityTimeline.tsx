"use client";

import { ShoppingCart, CreditCard, UserPlus, CheckCircle, Banknote } from "lucide-react";
import type { Customer, InvoiceHistory, PaymentHistory } from "@/lib/customer-details-data";

interface ActivityTimelineProps {
  customer: Customer;
  invoices: InvoiceHistory[];
  payments: PaymentHistory[];
}

type ActivityType = "customer_created" | "invoice_created" | "payment_received" | "advance_payment" | "invoice_paid";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  date: string;
}

const ICON_MAP: Record<ActivityType, React.ReactNode> = {
  customer_created: <UserPlus className="w-4 h-4" />,
  invoice_created: <ShoppingCart className="w-4 h-4" />,
  payment_received: <CreditCard className="w-4 h-4" />,
  advance_payment: <Banknote className="w-4 h-4" />,
  invoice_paid: <CheckCircle className="w-4 h-4" />,
};

const COLOR_MAP: Record<ActivityType, string> = {
  customer_created: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  invoice_created: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
  payment_received: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
  advance_payment: "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400",
  invoice_paid: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
};

export function ActivityTimeline({ customer, invoices, payments }: ActivityTimelineProps) {
  const activities: Activity[] = [];

  invoices.forEach((inv) => {
    activities.push({
      id: `invoice-${inv.id}`,
      type: "invoice_created",
      title: "Invoice Created",
      detail: `${inv.invoiceNumber} — Rs ${inv.total.toLocaleString()}`,
      date: inv.saleDate,
    });
    if (inv.status === "paid") {
      activities.push({
        id: `paid-${inv.id}`,
        type: "invoice_paid",
        title: "Invoice Paid",
        detail: `${inv.invoiceNumber} fully settled`,
        date: inv.saleDate,
      });
    }
  });

  payments.forEach((p) => {
    const isAdvance = !p.saleId;
    activities.push({
      id: `payment-${p.id}`,
      type: isAdvance ? "advance_payment" : "payment_received",
      title: isAdvance ? "Advance Payment" : "Payment Received",
      detail: `Rs ${p.amount.toLocaleString()} via ${p.paymentMethod.replace(/_/g, " ")}${p.invoiceNumber ? ` → ${p.invoiceNumber}` : ""}`,
      date: p.paymentDate,
    });
  });

  activities.push({
    id: "customer-created",
    type: "customer_created",
    title: "Customer Created",
    detail: "Account added to the system",
    date: customer.created_at,
  });

  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No activity recorded</p>
        </div>
      ) : (
        activities.map((activity, index) => (
          <div key={activity.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`p-2 rounded-full ${COLOR_MAP[activity.type]}`}>
                {ICON_MAP[activity.type]}
              </div>
              {index < activities.length - 1 && (
                <div className="w-0.5 flex-1 bg-border mt-2 min-h-[2rem]" />
              )}
            </div>
            <div className="flex-1 bg-card border border-border rounded-lg p-4 mt-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{activity.title}</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">{activity.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(activity.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
