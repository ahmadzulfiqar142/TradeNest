"use client";

import { Sale, Payment, Customer } from "@/lib/customer-details-data";
import { ShoppingCart, CreditCard, FileText } from "lucide-react";

interface ActivityTimelineProps {
  sales: Sale[];
  payments: Payment[];
  customer: Customer;
}

export function ActivityTimeline({
  sales,
  payments,
  customer,
}: ActivityTimelineProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <ShoppingCart className="w-5 h-5" />;
      case "payment":
        return <CreditCard className="w-5 h-5" />;
      case "note":
        return <FileText className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "purchase":
        return "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400";
      case "payment":
        return "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400";
      case "note":
        return "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400";
      default:
        return "bg-gray-100 dark:bg-gray-900";
    }
  };

  // Generate activities from sales and payments
  const activities = [
    ...sales.map((sale) => ({
      id: `purchase-${sale.id}`,
      type: "purchase" as const,
      action: "New Purchase",
      details: `Invoice ${sale.invoice_number} - $${Number(sale.total).toLocaleString()}`,
      date: sale.sale_date,
    })),
    ...payments.map((payment) => ({
      id: `payment-${payment.id}`,
      type: "payment" as const,
      action: "Payment Received",
      details: `$${Number(payment.amount).toLocaleString()} via ${payment.payment_method.replace(/_/g, " ")}`,
      date: payment.payment_date,
    })),
    {
      id: "customer-created",
      type: "note" as const,
      action: "Customer Created",
      details: "Customer account created in the system",
      date: customer.created_at,
    },
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
              <div className={`p-2.5 rounded-full ${getColor(activity.type)}`}>
                {getIcon(activity.type)}
              </div>
              {index < activities.length - 1 && (
                <div className="w-0.5 h-12 bg-border mt-2"></div>
              )}
            </div>
            <div className="flex-1 bg-card border border-border rounded-lg p-4 mt-1">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">
                    {activity.action}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activity.details}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
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
