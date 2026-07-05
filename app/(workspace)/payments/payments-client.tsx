"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Filter, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentForm } from "@/features/payments/components/payment-form";
import { deletePayment } from "@/actions/payment";
import { PaymentWithCustomer, PaymentsClientProps } from "@/types/payments";

export function PaymentsClient({
  payments,
  workspaceId,
  customers,
  searchParams,
}: PaymentsClientProps) {
  const typedPayments = payments as PaymentWithCustomer[];
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.search || "");
  const [showFilters, setShowFilters] = useState(false);

  const filteredPayments = useMemo(() => {
    return typedPayments.filter((payment) => {
      if (
        searchParams.customerId &&
        payment.customer_id !== searchParams.customerId
      )
        return false;
      if (
        searchParams.paymentMethod &&
        payment.payment_method !== searchParams.paymentMethod
      )
        return false;
      if (
        searchParams.startDate &&
        payment.payment_date < searchParams.startDate
      )
        return false;
      if (searchParams.endDate && payment.payment_date > searchParams.endDate)
        return false;
      return true;
    });
  }, [typedPayments, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }
    router.push(`/payments?${params.toString()}`);
  };

  const handlePaymentSuccess = async () => {
    setShowAddForm(false);
    setEditingPayment(null);
    router.refresh();
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) {
      return;
    }

    const result = await deletePayment(workspaceId, paymentId);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.message || "Failed to delete payment");
    }
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Customer
                </label>
                <select
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  onChange={(e) => {
                    const params = new URLSearchParams(window.location.search);
                    if (e.target.value) {
                      params.set("customerId", e.target.value);
                    } else {
                      params.delete("customerId");
                    }
                    router.push(`/payments?${params.toString()}`);
                  }}
                  value={searchParams.customerId || ""}
                >
                  <option value="">All Customers</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Payment Method
                </label>
                <select
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  onChange={(e) => {
                    const params = new URLSearchParams(window.location.search);
                    if (e.target.value) {
                      params.set("paymentMethod", e.target.value);
                    } else {
                      params.delete("paymentMethod");
                    }
                    router.push(`/payments?${params.toString()}`);
                  }}
                  value={searchParams.paymentMethod || ""}
                >
                  <option value="">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={searchParams.startDate || ""}
                  onChange={(e) => {
                    const params = new URLSearchParams(window.location.search);
                    if (e.target.value) {
                      params.set("startDate", e.target.value);
                    } else {
                      params.delete("startDate");
                    }
                    router.push(`/payments?${params.toString()}`);
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  End Date
                </label>
                <Input
                  type="date"
                  value={searchParams.endDate || ""}
                  onChange={(e) => {
                    const params = new URLSearchParams(window.location.search);
                    if (e.target.value) {
                      params.set("endDate", e.target.value);
                    } else {
                      params.delete("endDate");
                    }
                    router.push(`/payments?${params.toString()}`);
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Payment Form */}
      {(showAddForm || editingPayment) && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {editingPayment ? "Edit Payment" : "Add New Payment"}
            </h2>
            <PaymentForm
              workspaceId={workspaceId}
              customers={customers}
              mode={editingPayment ? "edit" : "create"}
              payment={editingPayment || undefined}
              onSuccess={handlePaymentSuccess}
            />
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No payments found</p>
              {!showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4"
                  variant="secondary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first payment
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        <Link
                          href={`/payments/${payment.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {payment.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/customers/${payment.customer_id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {payment.customers
                            ? `${payment.customers.first_name} ${payment.customers.last_name}`
                            : "Unknown"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${Number(payment.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {payment.reference_number ? (
                          <span className="font-mono text-xs text-muted-foreground">{payment.reference_number}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">
                        {payment.payment_method.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {payment.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPayment(payment)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeletePayment(payment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
