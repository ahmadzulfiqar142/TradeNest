"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/confirm-dialog";
import { PaymentForm } from "@/features/payments/components/payment-form";
import { deletePayment } from "@/actions/payment";
import type {
  PaymentWithCustomer,
  PaymentsClientProps,
} from "@/types/payments";
import { useToast } from "@/hooks/use-toast";

export function PaymentsClient({
  payments,
  workspaceId,
  customers,
  openSales = [],
  searchParams,
}: PaymentsClientProps) {
  const router = useRouter();

  // Auto-open form if coming from a sale detail page (saleId in URL)
  const [showAddForm, setShowAddForm] = useState(!!searchParams.saleId);
  const [editingPayment, setEditingPayment] =
    useState<PaymentWithCustomer | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.search ?? "");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return (payments as PaymentWithCustomer[]).filter((p) => {
      if (searchParams.customerId && p.customer_id !== searchParams.customerId)
        return false;
      if (
        searchParams.paymentMethod &&
        p.payment_method !== searchParams.paymentMethod
      )
        return false;
      if (searchParams.startDate && p.payment_date < searchParams.startDate)
        return false;
      if (searchParams.endDate && p.payment_date > searchParams.endDate)
        return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = p.customers
          ? `${p.customers.first_name} ${p.customers.last_name}`.toLowerCase()
          : "";
        return (
          name.includes(q) ||
          (p.reference_number ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, searchParams, searchQuery]);

  function pushParam(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    value ? params.set(key, value) : params.delete(key);
    router.push(`/payments?${params.toString()}`);
  }

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { success, error } = useToast();

  async function handleDelete() {
    if (!paymentToDelete) return;
    setDeleting(true);
    try {
      const result = await deletePayment(workspaceId, paymentToDelete);
      if (result.success) {
        success(result.message);
        router.refresh();
      } else {
        error(result.message);
      }
    } catch {
      error("Failed to delete payment");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    }
  }

  function handleSuccess() {
    setShowAddForm(false);
    setEditingPayment(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            pushParam("search", searchQuery);
          }}
          className="flex gap-2 flex-1 max-w-md"
        >
          <Input
            placeholder="Search customer, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowFilters((v) => !v)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            onClick={() => {
              setEditingPayment(null);
              setShowAddForm((v) => !v);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Customer
                </label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                  value={searchParams.customerId ?? ""}
                  onChange={(e) => pushParam("customerId", e.target.value)}
                >
                  <option value="">All Customers</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Method
                </label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                  value={searchParams.paymentMethod ?? ""}
                  onChange={(e) => pushParam("paymentMethod", e.target.value)}
                >
                  <option value="">All Methods</option>
                  {[
                    "cash",
                    "bank_transfer",
                    "jazzcash",
                    "easypaisa",
                    "credit_card",
                    "debit_card",
                    "cheque",
                    "other",
                  ].map((m) => (
                    <option key={m} value={m}>
                      {m.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  From
                </label>
                <Input
                  type="date"
                  value={searchParams.startDate ?? ""}
                  onChange={(e) => pushParam("startDate", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  To
                </label>
                <Input
                  type="date"
                  value={searchParams.endDate ?? ""}
                  onChange={(e) => pushParam("endDate", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add / Edit form */}
      {(showAddForm || editingPayment) && (
        <PaymentForm
          workspaceId={workspaceId}
          customers={customers}
          openSales={openSales}
          preselectedSaleId={searchParams.saleId ?? null}
          mode={editingPayment ? "edit" : "create"}
          payment={editingPayment ?? undefined}
          onSuccess={handleSuccess}
        />
      )}

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No payments found</p>
              {!showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4"
                  variant="secondary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add first payment
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.reference_number ?? p.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/customers/${p.customer_id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {p.customers
                            ? `${p.customers.first_name} ${p.customers.last_name}`
                            : "Unknown"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(p.payment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="capitalize text-sm">
                        {p.payment_method.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                        Rs. {Number(p.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {p.notes ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-300 hover:text-white hover:bg-gray-700"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingPayment(p);
                                setShowAddForm(false);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-400 focus:text-red-300"
                              onClick={() => {
                                setPaymentToDelete(p.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
