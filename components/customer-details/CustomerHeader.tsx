"use client";

import { Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Customer } from "@/lib/customer-details-data";

interface CustomerHeaderProps {
  customer: Customer;
}

export function CustomerHeader({ customer }: CustomerHeaderProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {customer.first_name} {customer.last_name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {customer.notes || "Customer"}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {customer.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{customer.phone}</span>
              </div>
            )}
            {(customer.address || customer.city) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>
                  {[customer.address, customer.city].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                Joined {new Date(customer.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              customer.status === "Active"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : customer.status === "Inactive"
                  ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            }`}
          >
            {customer.status}
          </div>
        </div>
      </div>
    </div>
  );
}
